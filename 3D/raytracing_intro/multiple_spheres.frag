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

vec3 multiple_spheres(Ray ray, Sphere spheres[4], int sphereCount) {
    float closestT = 1e20;
    int hitSphere = -1;

    for (int i = 0; i < sphereCount; i++) {
        float t = intersect_sphere(ray, spheres[i]);
        if (t > 0.0 && t < closestT) {
            closestT = t;
            hitSphere = i;
        }
    }

    if (hitSphere == -1) {
        return vec3(0.1, 0.1, 0.2);
    }

    vec3 hitPoint = ray.origin + closestT * ray.direction;
    vec3 normal = sphere_normal(hitPoint, spheres[hitSphere]);

    vec3 lightDir = normalize(vec3(sin(u_time), sin(u_time), cos(u_time)));
    float diffuse = max(0.2, dot(normal, lightDir));

    vec3 color = spheres[hitSphere].color * diffuse;

    return color;
}

void main() {
    Ray ray = createCameraRay();

    Sphere spheres[4];
    spheres[0] = Sphere(vec3(0.0, 0.0, 3.0), 0.3, vec3(1.0, 0.3, 0.3));
    spheres[1] = Sphere(vec3(-1.5, 0.5, 4.0), 0.6, vec3(0.3, 1.0, 0.3));
    spheres[2] = Sphere(vec3(1.2, -0.8, 2.5), 0.5, vec3(0.3, 0.3, 1.0));
    spheres[3] = Sphere(vec3(0.0, 1.5, 5.0), 0.7, vec3(1.0, 1.0, 0.3));

    spheres[0].center.x = sin(u_time) * 0.5;
    spheres[1].center.y = cos(u_time * 1.5) * 0.3;
    spheres[2].center.z = 2.5 + sin(u_time * 2.0) * 0.5;

    vec3 color = multiple_spheres(ray, spheres, 4);

    gl_FragColor = vec4(color, 1.0);
}
