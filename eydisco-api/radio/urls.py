from django.urls import path

from . import views

urlpatterns = [
    path('', views.RadioView.as_view(), name='radio'),
    path('shows/<slug:slug>/', views.ShowDetailView.as_view(), name='show-detail'),
]
