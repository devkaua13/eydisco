from django.urls import path

from . import views

urlpatterns = [
    path('', views.HouseListView.as_view(), name='houses'),
    path('<slug:slug>/', views.HouseDetailView.as_view(), name='house-detail'),
    path('<slug:slug>/live/', views.LiveView.as_view(), name='house-live'),
    path('<slug:slug>/presence/', views.PresenceView.as_view(), name='house-presence'),
    path('<slug:slug>/start/', views.StartView.as_view(), name='house-start'),
    path('<slug:slug>/reactions/', views.ReactionCreateView.as_view(), name='house-reactions'),
    path('<slug:slug>/messages/', views.MessageCreateView.as_view(), name='house-messages'),
]
