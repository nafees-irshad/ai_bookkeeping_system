from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name",
                  "phone", "password", "password2")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        # role is NOT accepted here, so new users always get the default (viewer)
        return User.objects.create_user(password=password, **validated_data)


class UserSerializer(serializers.ModelSerializer):
    """For a user viewing/updating their own profile. Role is read-only."""
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name",
                  "phone", "role", "date_joined")
        read_only_fields = ("id", "username", "role", "date_joined")


class AdminUserSerializer(serializers.ModelSerializer):
    """For admins managing other users. Role and is_active are editable."""
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name",
                  "phone", "role", "is_active", "date_joined")
        read_only_fields = ("id", "username", "date_joined")


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value