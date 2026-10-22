from django.contrib import admin

from .models import Drop, DropItem


class DropItemInline(admin.StackedInline):
    model = DropItem
    extra = 3
    max_num = 5
    autocomplete_fields = ['artist', 'release', 'track']


@admin.register(Drop)
class DropAdmin(admin.ModelAdmin):
    list_display = ['title', 'published_at']
    prepopulated_fields = {'slug': ['title']}
    inlines = [DropItemInline]
