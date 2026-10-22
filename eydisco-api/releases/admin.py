from django.contrib import admin

from .models import Credit, Edition, Extra, Release, Track


class EditionInline(admin.StackedInline):
    model = Edition
    extra = 0


class TrackInline(admin.TabularInline):
    model = Track
    fields = ['position', 'title', 'slug', 'audio', 'duration', 'is_featured']
    prepopulated_fields = {'slug': ['title']}
    extra = 0


class ExtraInline(admin.StackedInline):
    model = Extra
    extra = 0


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'presale_starts_at', 'released_at', 'is_featured']
    list_filter = ['artist', 'is_featured']
    search_fields = ['title', 'artist__name']
    prepopulated_fields = {'slug': ['title']}
    inlines = [EditionInline, TrackInline, ExtraInline]


class CreditInline(admin.TabularInline):
    model = Credit
    extra = 1


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    """Behind the Track: créditos, história e extras de cada faixa."""

    list_display = ['title', 'release', 'position', 'duration', 'is_featured']
    list_filter = ['release__artist', 'is_featured']
    search_fields = ['title', 'release__title']
    prepopulated_fields = {'slug': ['title']}
    inlines = [CreditInline, ExtraInline]
