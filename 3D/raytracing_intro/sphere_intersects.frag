#version 330 core
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define PI 3.14159265359

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
};

Ray createCameraRay() {
    float fov = radians(90.0);
    float fx = tan(fov / 2.0) / u_resolution.x;
    vec2 d = (2.0 * gl_FragCoord.xy - u_resolution.xy) * fx;
    return Ray(vec3(0.0), normalize(vec3(d, 1.0)));
}

float intersect_sphere(Ray ray, Sphere sphere) {
    vec3 oc = ray.origin - sphere.center;

    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(oc, ray.direction);
    float c = dot(oc, oc) - sphere.radius * sphere.radius;

    float discriminant = b * b - 4.0 * a * c;

    if (discriminant < 0.0) {
        return -1.0;
    }

    float sqrt_discriminant = sqrt(discriminant);

    float t1 = (-b - sqrt_discriminant) / (2.0 * a);
    if (t1 > 0.001) return t1;

    float t2 = (-b + sqrt_discriminant) / (2.0 * a);
    if (t2 > 0.001) return t2;

    return -1.0;
}

vec3 sphere_normal(vec3 point, Sphere sphere) {
    return normalize(point - sphere.center);
}

vec3 render_sphere(Ray ray, Sphere sphere) {
    float t = intersect_sphere(ray, sphere);

    if (t < 0.0) {
        return vec3(0.1, 0.1, 0.2);
    }
    vec3 hitPoint = ray.origin + t * ray.direction;
    vec3 normal = sphere_normal(hitPoint, sphere);
    vec3 lightDir = normalize(vec3(1.0, 1.0, 0.0));
    float diffuse = max(0.0, dot(normal, lightDir));
    vec3 color = sphere.color * diffuse;
    return color;
}

void main() {
    Ray ray = createCameraRay();
    Sphere sphere = Sphere(
            vec3(0.0, 0.0, 3.0),
            1.0,
            vec3(0.0, 1.0, 1.0)
        );

    vec3 color = render_sphere(ray, sphere);

    gl_FragColor = vec4(color, 1.0);
}
