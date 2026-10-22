from django.contrib import admin
from django.utils import timezone

from .models import Show, ShowTrack


class ShowTrackInline(admin.TabularInline):
    model = ShowTrack
    extra = 3
    autocomplete_fields = ['track']


@admin.action(description='Começar agora')
def start_now(modeladmin, request, queryset):
    queryset.update(starts_at=timezone.now())


@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = ['title', 'host_name', 'starts_at']
    actions = [start_now]
    prepopulated_fields = {'slug': ['title']}
    inlines = [ShowTrackInline]
