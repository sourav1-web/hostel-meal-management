from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class MonthlyPrice(models.Model):
    month = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        help_text="Month number (1-12)"
    )
    year = models.IntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)],
        help_text="Year (e.g., 2026)"
    )
    lunch_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Price for one lunch in this month"
    )
    dinner_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Price for one dinner in this month"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('month', 'year')
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.year}-{self.month:02d}: Lunch=₹{self.lunch_price}, Dinner=₹{self.dinner_price}"


class Attendance(models.Model):
    date = models.DateField(unique=True, db_index=True)
    lunch_taken = models.BooleanField(default=False)
    dinner_taken = models.BooleanField(default=False)
    note = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        l_flag = "L:Yes" if self.lunch_taken else "L:No"
        d_flag = "D:Yes" if self.dinner_taken else "D:No"
        return f"{self.date} [{l_flag}, {d_flag}]"


class MonthlyBillPayment(models.Model):
    month = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    year = models.IntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)]
    )
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True, default='UPI')
    payment_note = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('month', 'year')
        ordering = ['-year', '-month']

    def __str__(self):
        status = "PAID" if self.is_paid else "UNPAID"
        return f"{self.year}-{self.month:02d} - {status}"
