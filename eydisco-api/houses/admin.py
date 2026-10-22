from django.contrib import admin
from django.utils import timezone

from .models import House, HouseTrack


class HouseTrackInline(admin.TabularInline):
    model = HouseTrack
    extra = 3
    autocomplete_fields = ['track']


@admin.action(description='Começar agora')
def start_now(modeladmin, request, queryset):
    queryset.update(starts_at=timezone.now())


@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ['title', 'host', 'visibility', 'artist', 'starts_at']
    list_filter = ['visibility']
    actions = [start_now]
    prepopulated_fields = {'slug': ['title']}
    autocomplete_fields = ['host', 'artist']
    inlines = [HouseTrackInline]
