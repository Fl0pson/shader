#version 330
#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

const int MAX_STEPS = 24;
const float HIT_EPSILON = 0.01;
const float FAR_CLIP = 20.0;
const float NORMAL_EPSILON = 0.0005;

struct Ray {
    vec3 origin;
    vec3 dir;
};

mat3 rotationAroundAxis(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(
        oc * axis.x * axis.x + c,
        oc * axis.x * axis.y - axis.z * s,
        oc * axis.x * axis.z + axis.y * s,

        oc * axis.y * axis.x + axis.z * s,
        oc * axis.y * axis.y + c,
        oc * axis.y * axis.z - axis.x * s,

        oc * axis.z * axis.x - axis.y * s,
        oc * axis.z * axis.y + axis.x * s,
        oc * axis.z * axis.z + c
    );
}
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float distSpheres(vec3 point) {
    point = mod(point + 2.0, 2.0) - 1.0;
    return sdSphere(point, 0.5);
}

Ray createCameraRay(vec2 coord) {
    float fov = radians(90.0);
    float fx = tan(fov / 2.0) / u_resolution.x;
    vec2 d = (2.0 * coord - u_resolution) * fx;
    return Ray(vec3(0.0, 0.0, -2.0), normalize(vec3(d, 1.0)));
}

vec3 calcNormal(vec3 p) {
    vec2 h = vec2(NORMAL_EPSILON, 0.0);
    return normalize(vec3(
            distSpheres(p + h.xyy) - distSpheres(p - h.xyy),
            distSpheres(p + h.yxy) - distSpheres(p - h.yxy),
            distSpheres(p + h.yyx) - distSpheres(p - h.yyx)
        ));
}

vec3 rayMarch(Ray cameraRay) {
    float t = 0.0;
    mat3 rotMat = rotationAroundAxis(vec3(1.0, 1.0, 1.0), u_time * 0.5);
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 point = cameraRay.origin + t * cameraRay.dir;
        point = point * rotMat;
        float dist = distSpheres(point);

        if (dist < HIT_EPSILON) {
            vec3 normal = calcNormal(point);
            vec3 lightDir = normalize(vec3(0.5, 0.6, 0.7));
            return vec3(fract(point) + max(dot(normal, lightDir), 0.0));
        }

        if (t > FAR_CLIP) break;
        t += dist;
    }

    return vec3(0.0);
}

void main() {
    vec2 coord = gl_FragCoord.xy;
    Ray cameraRay = createCameraRay(coord);
    vec3 color = rayMarch(cameraRay);
    gl_FragColor = vec4(color, 1.0);
}
