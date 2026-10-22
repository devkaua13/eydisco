from django.urls import path

from . import views

urlpatterns = [
    path('route/', views.RouteView.as_view(), name='route'),
    path('drops/', views.DropListView.as_view(), name='drops'),
    path('drops/<slug:slug>/', views.DropDetailView.as_view(), name='drop-detail'),
]
