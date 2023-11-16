from rest_framework import renderers, views
from rest_framework.request import Request
from rest_framework.response import Response

from packages.modules import npm
from packages.serializers import PackageSerializer


class PackageView(views.APIView):
    renderer_classes = [renderers.JSONRenderer]

    def get(self, request: Request, package_name: str, range: str | None = None):
        if range is None:
            range = "*"

        package_info = npm.get_package(package_name, range)
        serializer = PackageSerializer(package_info)
        return Response(serializer.data)
