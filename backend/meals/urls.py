from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PriceViewSet,
    AttendanceViewSet,
    MonthlyBillView,
    TogglePaymentView,
    MonthHistoryView,
    ExportMonthlyCSVView,
    SeedSampleDataView,
)

router = DefaultRouter()
router.register(r'prices', PriceViewSet, basename='price')
router.register(r'attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('bill/', MonthlyBillView.as_view(), name='monthly-bill'),
    path('bill/toggle-payment/', TogglePaymentView.as_view(), name='toggle-payment'),
    path('history/', MonthHistoryView.as_view(), name='month-history'),
    path('export/csv/', ExportMonthlyCSVView.as_view(), name='export-csv'),
    path('seed/', SeedSampleDataView.as_view(), name='seed-sample-data'),
    path('', include(router.urls)),
]
