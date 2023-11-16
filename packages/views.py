from rest_framework import renderers, views
from rest_framework.request import Request
from rest_framework.response import Response

from packages.modules import npm
from packages.serializers import VersionedPackageSerializer


class PackageView(views.APIView):
    renderer_classes = [renderers.JSONRenderer]

    def get(self, request: Request, package_name: str, version: str):
        package_info = npm.get_versioned_package(package_name, version)
        serializer = VersionedPackageSerializer(package_info)
        return Response(serializer.data)
