from django.contrib import admin
from .models import MonthlyPrice, Attendance, MonthlyBillPayment


@admin.register(MonthlyPrice)
class MonthlyPriceAdmin(admin.ModelAdmin):
    list_display = ('year', 'month', 'lunch_price', 'dinner_price', 'updated_at')
    list_filter = ('year', 'month')
    ordering = ('-year', '-month')


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('date', 'lunch_taken', 'dinner_taken', 'note', 'updated_at')
    list_filter = ('lunch_taken', 'dinner_taken', 'date')
    search_fields = ('date', 'note')
    ordering = ('-date',)


@admin.register(MonthlyBillPayment)
class MonthlyBillPaymentAdmin(admin.ModelAdmin):
    list_display = ('year', 'month', 'is_paid', 'paid_date', 'payment_method', 'updated_at')
    list_filter = ('is_paid', 'year', 'month')
    ordering = ('-year', '-month')
