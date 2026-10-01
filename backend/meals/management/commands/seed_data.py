from django.core.management.base import BaseCommand
from datetime import datetime, date
from decimal import Decimal
import calendar
import random
from meals.models import MonthlyPrice, Attendance, MonthlyBillPayment


class Command(BaseCommand):
    help = 'Seeds sample hostel meal attendance and price data'

    def handle(self, *args, **options):
        now = datetime.now()
        month = now.month
        year = now.year

        # Set prices
        price, created = MonthlyPrice.objects.update_or_create(
            month=month,
            year=year,
            defaults={'lunch_price': Decimal('50.00'), 'dinner_price': Decimal('60.00')}
        )
        self.stdout.write(self.style.SUCCESS(f"Set prices for {year}-{month:02d}: Lunch=Rs 50, Dinner=Rs 60"))

        # Previous month prices & full attendance for September 2026
        prev_month = 12 if month == 1 else month - 1
        prev_year = year - 1 if month == 1 else year
        MonthlyPrice.objects.update_or_create(
            month=prev_month,
            year=prev_year,
            defaults={'lunch_price': Decimal('48.00'), 'dinner_price': Decimal('58.00')}
        )

        _, prev_days = calendar.monthrange(prev_year, prev_month)
        random.seed(99)
        for d in range(1, prev_days + 1):
            cur_date = date(prev_year, prev_month, d)
            is_weekend = cur_date.weekday() >= 5
            l_taken = random.random() > (0.4 if is_weekend else 0.12)
            d_taken = random.random() > (0.25 if is_weekend else 0.08)
            Attendance.objects.update_or_create(
                date=cur_date,
                defaults={'lunch_taken': l_taken, 'dinner_taken': d_taken, 'note': 'Weekend trip' if is_weekend and not l_taken and not d_taken else ''}
            )

        MonthlyBillPayment.objects.update_or_create(
            month=prev_month,
            year=prev_year,
            defaults={'is_paid': True, 'paid_date': date(prev_year, prev_month, 28), 'payment_method': 'UPI', 'payment_note': 'GPay'}
        )

        # Current month
        _, days_in_month = calendar.monthrange(year, month)
        limit_day = max(min(now.day, days_in_month), 5)

        random.seed(42)
        count = 0
        for d in range(1, limit_day + 1):
            cur_date = date(year, month, d)
            is_weekend = cur_date.weekday() >= 5
            l_taken = random.random() > (0.4 if is_weekend else 0.15)
            d_taken = random.random() > (0.3 if is_weekend else 0.1)

            note = ""
            if not l_taken and not d_taken:
                note = "Away / home"
            elif not l_taken:
                note = "Had lunch in college canteen"

            Attendance.objects.update_or_create(
                date=cur_date,
                defaults={
                    'lunch_taken': l_taken,
                    'dinner_taken': d_taken,
                    'note': note
                }
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded September (full month + paid) and October ({count} days) sample data."))

