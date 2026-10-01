import calendar
import csv
from datetime import datetime, date
from decimal import Decimal
from django.http import HttpResponse
from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action

from .models import MonthlyPrice, Attendance, MonthlyBillPayment
from .serializers import (
    MonthlyPriceSerializer,
    AttendanceSerializer,
    BulkAttendanceItemSerializer,
    MonthlyBillPaymentSerializer,
)


class PriceViewSet(viewsets.ModelViewSet):
    queryset = MonthlyPrice.objects.all()
    serializer_class = MonthlyPriceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month:
            qs = qs.filter(month=int(month))
        if year:
            qs = qs.filter(year=int(year))
        return qs

    def create(self, request, *args, **kwargs):
        month = request.data.get('month')
        year = request.data.get('year')
        lunch_price = request.data.get('lunch_price', 0)
        dinner_price = request.data.get('dinner_price', 0)

        if not month or not year:
            return Response(
                {"error": "month and year are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        price_obj, created = MonthlyPrice.objects.update_or_create(
            month=int(month),
            year=int(year),
            defaults={
                'lunch_price': Decimal(str(lunch_price)),
                'dinner_price': Decimal(str(dinner_price)),
            }
        )
        serializer = self.get_serializer(price_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def current_or_suggested(self, request):
        """
        Returns prices for requested month/year.
        If not set, finds the most recent previous month's price to suggest.
        """
        now = datetime.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        price_obj = MonthlyPrice.objects.filter(month=month, year=year).first()
        if price_obj:
            return Response({
                'is_configured': True,
                'data': MonthlyPriceSerializer(price_obj).data,
                'suggested_from_previous': False
            })

        # Find closest prior price
        prior_price = MonthlyPrice.objects.filter(
            Q(year__lt=year) | Q(year=year, month__lt=month)
        ).order_by('-year', '-month').first()

        if prior_price:
            return Response({
                'is_configured': False,
                'data': {
                    'month': month,
                    'year': year,
                    'lunch_price': str(prior_price.lunch_price),
                    'dinner_price': str(prior_price.dinner_price),
                },
                'suggested_from_previous': True,
                'previous_period': f"{prior_price.year}-{prior_price.month:02d}"
            })

        return Response({
            'is_configured': False,
            'data': {
                'month': month,
                'year': year,
                'lunch_price': '50.00',
                'dinner_price': '60.00',
            },
            'suggested_from_previous': False
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        date_str = self.request.query_params.get('date')

        if date_str:
            qs = qs.filter(date=date_str)
        elif month and year:
            qs = qs.filter(date__year=int(year), date__month=int(month))
        return qs.order_by('date')

    def create(self, request, *args, **kwargs):
        """
        Upsert attendance for a specific date.
        """
        date_val = request.data.get('date')
        if not date_val:
            return Response({"error": "date is required"}, status=status.HTTP_400_BAD_REQUEST)

        lunch_taken = request.data.get('lunch_taken', False)
        dinner_taken = request.data.get('dinner_taken', False)
        note = request.data.get('note', '')

        att, created = Attendance.objects.update_or_create(
            date=date_val,
            defaults={
                'lunch_taken': bool(lunch_taken),
                'dinner_taken': bool(dinner_taken),
                'note': note
            }
        )
        serializer = self.get_serializer(att)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """
        Fast toggle a single meal for a date: { date: 'YYYY-MM-DD', meal: 'lunch'|'dinner', taken: true/false }
        """
        date_val = request.data.get('date')
        meal = request.data.get('meal')
        taken = request.data.get('taken')

        if not date_val or meal not in ['lunch', 'dinner']:
            return Response(
                {"error": "Valid date and meal ('lunch' or 'dinner') are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        att = Attendance.objects.filter(date=date_val).first()
        if not att:
            att = Attendance(date=date_val, lunch_taken=False, dinner_taken=False)

        if meal == 'lunch':
            att.lunch_taken = bool(taken if taken is not None else not att.lunch_taken)
        elif meal == 'dinner':
            att.dinner_taken = bool(taken if taken is not None else not att.dinner_taken)

        att.save()
        return Response(AttendanceSerializer(att).data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Bulk update attendance for multiple dates.
        """
        items = request.data.get('items', [])
        saved = []
        for item in items:
            date_val = item.get('date')
            if not date_val:
                continue
            defaults = {}
            if 'lunch_taken' in item:
                defaults['lunch_taken'] = bool(item['lunch_taken'])
            if 'dinner_taken' in item:
                defaults['dinner_taken'] = bool(item['dinner_taken'])
            if 'note' in item:
                defaults['note'] = item['note']

            att, _ = Attendance.objects.update_or_create(date=date_val, defaults=defaults)
            saved.append(AttendanceSerializer(att).data)

        return Response({"count": len(saved), "records": saved})


class MonthlyBillView(APIView):
    """
    Computes real-time bill for a given month and year.
    Returns:
    - total lunches, total dinners, total meals
    - lunch_price, dinner_price (with is_price_set flag)
    - lunch_amount, dinner_amount, grand_total
    - days_in_month, attendance_records_count
    - payment info (is_paid, paid_date, etc.)
    """
    def get(self, request):
        now = datetime.now()
        try:
            month = int(request.query_params.get('month', now.month))
            year = int(request.query_params.get('year', now.year))
        except (ValueError, TypeError):
            return Response({"error": "Invalid month or year"}, status=status.HTTP_400_BAD_REQUEST)

        # Get attendance records for this month
        records = Attendance.objects.filter(date__year=year, date__month=month)
        total_lunches = records.filter(lunch_taken=True).count()
        total_dinners = records.filter(dinner_taken=True).count()
        total_meals = total_lunches + total_dinners

        # Get price settings
        price_obj = MonthlyPrice.objects.filter(month=month, year=year).first()
        is_price_set = price_obj is not None
        lunch_price = price_obj.lunch_price if price_obj else Decimal('0.00')
        dinner_price = price_obj.dinner_price if price_obj else Decimal('0.00')

        lunch_amount = Decimal(total_lunches) * lunch_price
        dinner_amount = Decimal(total_dinners) * dinner_price
        grand_total = lunch_amount + dinner_amount

        # Payment status
        payment = MonthlyBillPayment.objects.filter(month=month, year=year).first()
        payment_info = {
            'is_paid': payment.is_paid if payment else False,
            'paid_date': payment.paid_date.strftime('%Y-%m-%d') if payment and payment.paid_date else None,
            'payment_method': payment.payment_method if payment else 'UPI',
            'payment_note': payment.payment_note if payment else '',
        }

        _, days_in_month = calendar.monthrange(year, month)

        # Quick daily attendance map: date -> {lunch_taken, dinner_taken, note, id}
        daily_map = {
            rec.date.strftime('%Y-%m-%d'): {
                'id': rec.id,
                'lunch_taken': rec.lunch_taken,
                'dinner_taken': rec.dinner_taken,
                'note': rec.note,
            }
            for rec in records
        }

        return Response({
            'month': month,
            'year': year,
            'month_name': calendar.month_name[month],
            'days_in_month': days_in_month,
            'is_price_set': is_price_set,
            'lunch_price': float(lunch_price),
            'dinner_price': float(dinner_price),
            'total_lunches': total_lunches,
            'total_dinners': total_dinners,
            'total_meals': total_meals,
            'lunch_amount': float(lunch_amount),
            'dinner_amount': float(dinner_amount),
            'grand_total': float(grand_total),
            'payment': payment_info,
            'daily_map': daily_map,
        })


class TogglePaymentView(APIView):
    """
    Toggle or update payment status for a month.
    """
    def post(self, request):
        month = request.data.get('month')
        year = request.data.get('year')
        is_paid = request.data.get('is_paid')
        payment_method = request.data.get('payment_method', 'UPI')
        payment_note = request.data.get('payment_note', '')

        if not month or not year:
            return Response({"error": "month and year required"}, status=status.HTTP_400_BAD_REQUEST)

        payment, _ = MonthlyBillPayment.objects.get_or_create(month=int(month), year=int(year))
        
        if is_paid is not None:
            payment.is_paid = bool(is_paid)
        else:
            payment.is_paid = not payment.is_paid

        if payment.is_paid and not payment.paid_date:
            payment.paid_date = date.today()
        elif not payment.is_paid:
            payment.paid_date = None

        if payment_method:
            payment.payment_method = payment_method
        if payment_note is not None:
            payment.payment_note = payment_note

        payment.save()
        return Response({
            'success': True,
            'payment': MonthlyBillPaymentSerializer(payment).data
        })


class MonthHistoryView(APIView):
    """
    Returns list of all months that have attendance entries, prices, or payment info.
    Aggregates bill totals and status for each month.
    """
    def get(self, request):
        # Gather all distinct year, month from Attendance, MonthlyPrice, MonthlyBillPayment
        attendance_dates = Attendance.objects.dates('date', 'month', order='DESC')
        distinct_periods = set((d.year, d.month) for d in attendance_dates)

        prices = MonthlyPrice.objects.values_list('year', 'month')
        for y, m in prices:
            distinct_periods.add((y, m))

        payments = MonthlyBillPayment.objects.values_list('year', 'month')
        for y, m in payments:
            distinct_periods.add((y, m))

        # Always include the current month
        now = datetime.now()
        distinct_periods.add((now.year, now.month))

        sorted_periods = sorted(list(distinct_periods), key=lambda x: (x[0], x[1]), reverse=True)

        history = []
        for year, month in sorted_periods:
            records = Attendance.objects.filter(date__year=year, date__month=month)
            lunch_count = records.filter(lunch_taken=True).count()
            dinner_count = records.filter(dinner_taken=True).count()

            price = MonthlyPrice.objects.filter(month=month, year=year).first()
            lunch_price = price.lunch_price if price else Decimal('0.00')
            dinner_price = price.dinner_price if price else Decimal('0.00')

            total_amount = (Decimal(lunch_count) * lunch_price) + (Decimal(dinner_count) * dinner_price)

            payment = MonthlyBillPayment.objects.filter(month=month, year=year).first()
            is_paid = payment.is_paid if payment else False

            history.append({
                'year': year,
                'month': month,
                'month_name': calendar.month_name[month],
                'lunch_count': lunch_count,
                'dinner_count': dinner_count,
                'total_meals': lunch_count + dinner_count,
                'lunch_price': float(lunch_price),
                'dinner_price': float(dinner_price),
                'has_price': price is not None,
                'total_amount': float(total_amount),
                'is_paid': is_paid,
                'paid_date': payment.paid_date.strftime('%Y-%m-%d') if (payment and payment.paid_date) else None,
            })

        return Response(history)


class ExportMonthlyCSVView(APIView):
    """
    Exports a monthly report as CSV.
    """
    def get(self, request):
        now = datetime.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="meal_report_{year}_{month:02d}.csv"'

        writer = csv.writer(response)
        writer.writerow([f"Hostel Meal Attendance & Bill Report - {calendar.month_name[month]} {year}"])
        writer.writerow([])

        price = MonthlyPrice.objects.filter(month=month, year=year).first()
        lunch_price = price.lunch_price if price else Decimal('0.00')
        dinner_price = price.dinner_price if price else Decimal('0.00')

        writer.writerow(["Lunch Price (Rs)", float(lunch_price)])
        writer.writerow(["Dinner Price (Rs)", float(dinner_price)])
        writer.writerow([])

        writer.writerow(["Date", "Day", "Lunch Taken", "Dinner Taken", "Daily Total (Rs)", "Notes"])

        _, days_in_month = calendar.monthrange(year, month)
        records = {r.date: r for r in Attendance.objects.filter(date__year=year, date__month=month)}

        total_lunch = 0
        total_dinner = 0
        grand_total = Decimal('0.00')

        for d in range(1, days_in_month + 1):
            cur_date = date(year, month, d)
            day_name = cur_date.strftime('%a')
            rec = records.get(cur_date)
            l_taken = rec.lunch_taken if rec else False
            d_taken = rec.dinner_taken if rec else False
            notes = rec.note if rec else ""

            if l_taken:
                total_lunch += 1
            if d_taken:
                total_dinner += 1

            daily_cost = (lunch_price if l_taken else Decimal('0.00')) + (dinner_price if d_taken else Decimal('0.00'))
            grand_total += daily_cost

            writer.writerow([
                cur_date.strftime('%Y-%m-%d'),
                day_name,
                "YES" if l_taken else "NO",
                "YES" if d_taken else "NO",
                float(daily_cost),
                notes
            ])

        writer.writerow([])
        writer.writerow(["SUMMARY"])
        writer.writerow(["Total Lunches", total_lunch, f"@ Rs {lunch_price}", float(Decimal(total_lunch) * lunch_price)])
        writer.writerow(["Total Dinners", total_dinner, f"@ Rs {dinner_price}", float(Decimal(total_dinner) * dinner_price)])
        writer.writerow(["Grand Total", "", "", float(grand_total)])

        payment = MonthlyBillPayment.objects.filter(month=month, year=year).first()
        paid_str = "PAID" if payment and payment.is_paid else "UNPAID"
        writer.writerow(["Payment Status", paid_str])

        return response


class SeedSampleDataView(APIView):
    """
    Helper endpoint to populate realistic demo data for the current month so the user has instant live data to view.
    """
    def post(self, request):
        now = datetime.now()
        month = int(request.data.get('month', now.month))
        year = int(request.data.get('year', now.year))

        # Set price: 50 lunch, 60 dinner
        MonthlyPrice.objects.update_or_create(
            month=month,
            year=year,
            defaults={'lunch_price': Decimal('55.00'), 'dinner_price': Decimal('65.00')}
        )

        _, days_in_month = calendar.monthrange(year, month)
        today = date.today()

        # Seed up to today or up to 20 days
        limit_day = today.day if (today.year == year and today.month == month) else min(days_in_month, 25)

        import random
        random.seed(42)

        created_count = 0
        for d in range(1, limit_day + 1):
            cur_date = date(year, month, d)
            # Most days take lunch & dinner, weekends maybe skip one
            is_weekend = cur_date.weekday() >= 5
            l_taken = random.random() > (0.4 if is_weekend else 0.15)
            d_taken = random.random() > (0.3 if is_weekend else 0.1)

            note = ""
            if not l_taken and not d_taken:
                note = "Home visit"
            elif not l_taken:
                note = "Ate outside"

            Attendance.objects.update_or_create(
                date=cur_date,
                defaults={
                    'lunch_taken': l_taken,
                    'dinner_taken': d_taken,
                    'note': note
                }
            )
            created_count += 1

        return Response({"message": f"Successfully seeded prices and {created_count} days of sample attendance for {year}-{month:02d}."})
