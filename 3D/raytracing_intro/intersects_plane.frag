#version 330 core

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14159265359

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Plane {
    vec3 Point;
    vec3 Normal;
};

Ray createCameraRay() {
    float fov = radians(90.0);
    float fx = tan(fov / 2.0) / u_resolution.x;
    vec2 d = (2.0 * gl_FragCoord.xy - u_resolution.xy) * fx;
    return Ray(vec3(0.0), normalize(vec3(d, 1.0)));
}

float intersectPlane(Ray ray, Plane plane) {
    float denom = dot(plane.Normal, ray.direction);
    if (abs(denom) < 1e-6) return -1.0;
    float t = dot(plane.Normal, plane.Point - ray.origin) / denom;
    if (t < 0.0) return -1.0;
    return t;
}

void main() {
    Ray ray = createCameraRay();
    Plane plane = Plane(vec3(0.0, -1.0, 0.0), vec3(0.0, 1.0, 0.0));

    float t = intersectPlane(ray, plane);

    vec3 color = vec3(0.1, 0.1, 0.2);

    if (t > 0.0) {
        vec3 hitPoint = ray.origin + t * ray.direction;
        vec3 planeColor = vec3(1.0);
        float checker = mod(floor(hitPoint.x) + floor(hitPoint.z), 2.0);
        planeColor = mix(planeColor, vec3(0.3), checker);
        color = planeColor;
    }

    gl_FragColor = vec4(color, 1.0);
}
