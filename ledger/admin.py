from django.contrib import admin
from .models import Account, Book, BookMember, JournalEntry, JournalLine

admin.site.register([Book, BookMember, Account, JournalEntry, JournalLine])