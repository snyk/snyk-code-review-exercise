from django.urls import path

from packages import views

urlpatterns = [
    path("<str:package_name>", views.PackageView.as_view()),
    path("<str:package_name>/<str:version>", views.PackageView.as_view()),
]
