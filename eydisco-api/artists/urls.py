from django.urls import path

from . import views

urlpatterns = [
    path('<slug:slug>/', views.ArtistDetailView.as_view(), name='artist-detail'),
    path('<slug:slug>/follow/', views.FollowView.as_view(), name='artist-follow'),
]
