#version 330 core

precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14159265359

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Triangle {
    vec3 A;
    vec3 B;
    vec3 C;
    vec3 normal;
    vec3 center;
    vec3 color;
};
struct Pyramid {
    Triangle sides[6];
    int face_count;
};

Ray createCameraRay() {
    float fov = radians(90.0);
    float fx = tan(fov / 2.0) / u_resolution.x;
    vec2 d = (2.0 * gl_FragCoord.xy - u_resolution.xy) * fx;

    return Ray(vec3(0.0), normalize(vec3(d, 1.0)));
}

float intersect_triangle(Ray ray, Triangle tri) {
    vec3 E1 = tri.A - tri.C;
    vec3 E2 = tri.B - tri.C;
    vec3 P = cross(ray.direction, E2);
    float detM = dot(P, E1);
    float eps = 1e-5;

    if (detM > -eps && detM < eps) {
        return -1.0;
    }

    vec3 S = ray.origin - tri.C;
    float invDetM = 1.0 / detM;
    float u = invDetM * dot(P, S);

    if (u < 0.0 || u > 1.0) {
        return -1.0;
    }

    vec3 Q = cross(S, E1);
    float v = invDetM * dot(Q, ray.direction);

    if (v < 0.0 || u + v > 1.0) {
        return -1.0;
    }

    float t = invDetM * dot(Q, E2);
    return t > eps ? t : -1.0;
}
Triangle create_triangle(vec3 a, vec3 b, vec3 c, vec3 color) {
    vec3 center = (a + b + c) / 3.0; // Centroid formula
    vec3 normal = normalize(cross(b - a, c - a));
    return Triangle(a, b, c, normal, center, color);
}

mat3 rotate_X(float angle) {
    float c = cos(angle);
    float s = sin(angle);

    return mat3(1.0, 0.0, 0.0,
        0.0, c, -s,
        0.0, s, c
    );
}
mat3 rotate_Y(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c, 0.0, s,
        0.0, 1.0, 0.0,
        -s, 0.0, c
    );
}
mat3 rotate_Z(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c, -s, 0.0,
        s, c, 0.0,
        0.0, 0.0, 1.0
    );
}

Triangle rotate_triangle(Triangle tri, mat3 rotation) {
    // Move to origin
    vec3 a = tri.A - tri.center;
    vec3 b = tri.B - tri.center;
    vec3 c = tri.C - tri.center;

    // Apply rotation
    a = rotation * a;
    b = rotation * b;
    c = rotation * c;

    // Move back to original center (or new position)
    a += tri.center;
    b += tri.center;
    c += tri.center;

    // Return new triangle with updated center

    return create_triangle(a, b, c, tri.color);
}

Pyramid create_pyramid(vec3 center, float size) {
    vec3 base1 = center + vec3(-size, -size, 0.0);
    vec3 base2 = center + vec3(size, -size, 0.0);
    vec3 base3 = center + vec3(size, size, 0.0);
    vec3 base4 = center + vec3(-size, size, 0.0);
    vec3 top = center + vec3(0.0, 0.0, 2.5 * size);

    return Pyramid(
        Triangle[6](
            create_triangle(base1, base2, top, vec3(1.0, 0.0, 0.0)),
            create_triangle(base2, base3, top, vec3(0.0, 1.0, 0.0)),
            create_triangle(base3, base4, top, vec3(0.0, 0.0, 1.0)),
            create_triangle(base4, base1, top, vec3(1.0, .0, 1.0)),
            create_triangle(base1, base3, base2, vec3(.0, .0, .0)),
            create_triangle(base1, base4, base3, vec3(.0, .0, .0))
        ),
        6
    );
}
void render_triangle(Ray ray) {
    Triangle triangle = create_triangle(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 2.0), vec3(0.0));
    mat3 rot_X = rotate_Z(u_time);
    triangle = rotate_triangle(triangle, rot_X);
    float inter = intersect_triangle(ray, triangle);
    if (inter > 0.0) {
        triangle.color = vec3(
                0.5 + 0.5 * sin(u_time),
                0.5 + 0.5 * sin(u_time + 2.0),
                0.5 + 0.5 * sin(u_time + 4.0)
            );
    } else {
        triangle.color = vec3(0.0);
    }
    gl_FragColor = vec4(triangle.color, 1.0);
}
vec3 calculate_normal(vec3 a, vec3 b, vec3 c) {
    return normalize(cross(b - a, c - a));
}
Pyramid rotate_pyramid(Pyramid pyramid, mat3 rotation, vec3 center) {
    for (int i = 0; i < pyramid.face_count; i++) {
        pyramid.sides[i].A = rotation * (pyramid.sides[i].A - center) + center;
        pyramid.sides[i].B = rotation * (pyramid.sides[i].B - center) + center;
        pyramid.sides[i].C = rotation * (pyramid.sides[i].C - center) + center;

        pyramid.sides[i].normal = calculate_normal(
                pyramid.sides[i].A,
                pyramid.sides[i].B,
                pyramid.sides[i].C
            );
    }
    return pyramid;
}
void render_pyramid(Ray ray) {
    Pyramid pyramid = create_pyramid(vec3(0., 0.0, 3.0), 0.5);
    mat3 rotation = rotate_X(u_time) * rotate_Z(u_time);
    pyramid = rotate_pyramid(pyramid, rotation, vec3(0., 0.0, 3.0));
    // pyramid = rotate_pyramid(pyramid, rotate_X(u_time) * rotate_Z(u_time), vec3(0., 0.0, 3.0));
    float closestT = 1e20;
    vec3 color = vec3(1.0);
    vec3 hitNormal;

    for (int i = 0; i < pyramid.face_count; i++) {
        float t = intersect_triangle(ray, pyramid.sides[i]);
        if (t > 0.0 && t < closestT) {
            closestT = t;
            hitNormal = pyramid.sides[i].normal;

            vec3 lightDir = normalize(rotation * vec3(0.0, 2.0, 5.0));

            float lighting = max(0.0, dot(hitNormal, lightDir));
            color = pyramid.sides[i].color * lighting;
        }
    }

    gl_FragColor = vec4(color, 1.0);
}
void main() {
    Ray ray = createCameraRay();
    // render_triangle(ray);
    render_pyramid(ray);
}
