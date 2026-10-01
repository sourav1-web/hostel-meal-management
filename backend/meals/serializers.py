from rest_framework import serializers
from .models import MonthlyPrice, Attendance, MonthlyBillPayment


class MonthlyPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyPrice
        fields = ['id', 'month', 'year', 'lunch_price', 'dinner_price', 'created_at', 'updated_at']

    def validate(self, data):
        month = data.get('month')
        year = data.get('year')
        lunch_price = data.get('lunch_price')
        dinner_price = data.get('dinner_price')

        if lunch_price is not None and lunch_price < 0:
            raise serializers.ValidationError({"lunch_price": "Price cannot be negative."})
        if dinner_price is not None and dinner_price < 0:
            raise serializers.ValidationError({"dinner_price": "Price cannot be negative."})
        return data


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'date', 'lunch_taken', 'dinner_taken', 'note', 'created_at', 'updated_at']


class BulkAttendanceItemSerializer(serializers.Serializer):
    date = serializers.DateField()
    lunch_taken = serializers.BooleanField(required=False)
    dinner_taken = serializers.BooleanField(required=False)
    note = serializers.CharField(required=False, allow_blank=True, default='')


class MonthlyBillPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyBillPayment
        fields = ['id', 'month', 'year', 'is_paid', 'paid_date', 'payment_method', 'payment_note', 'created_at', 'updated_at']
