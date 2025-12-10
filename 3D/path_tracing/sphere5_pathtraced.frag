#version 330

uniform float u_time;
uniform vec2 u_resolution;

const int MAX_STEPS = 42;
const float HIT_EPSILON = 1e-3;
const float FAR_CLIP = 20.0;
const float NORMAL_EPSILON = 0.000005;

struct Ray {
    vec3 origin;
    vec3 dir;
};

float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

mat3 rotationAroundAxis(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
        oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.x * axis.z + axis.y * s,
        oc * axis.y * axis.x + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s, oc * axis.z * axis.y + axis.x * s, oc * axis.z * axis.z + c
    );
}

float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float distSpheres(vec3 point) {
    point = mod(point + 2.0, 2.0) - 1.0;
    return sdSphere(point, 0.5);
}

float map(vec3 p) {
    return distSpheres(p);
}

Ray createCameraRay(vec2 coord) {
    float fov = radians(90.0);
    float fx = tan(fov / 2.0) / u_resolution.x;
    vec2 d = (2.0 * coord - u_resolution) * fx;
    return Ray(vec3(0.0, 0.0, -3.0), normalize(vec3(d, 1.0)));
}

vec3 calcNormal(vec3 p) {
    vec2 h = vec2(NORMAL_EPSILON, 0.0);
    return normalize(vec3(
            map(p + h.xyy) - map(p - h.xyy),
            map(p + h.yxy) - map(p - h.yxy),
            map(p + h.yyx) - map(p - h.yyx)
        ));
}

vec3 randomHemisphere(vec3 n, vec2 seed) {
    float u = rand(seed);
    float v = rand(seed * 1.3);
    float theta = 6.2831853 * u;
    float r = sqrt(v);
    vec3 d = vec3(r * cos(theta), r * sin(theta), sqrt(1.0 - v));
    return dot(d, n) < 0.0 ? -d : d;
}

const int MAX_BOUNCES = 20;
const int MAX_SAMPLES = 20;

vec3 tracePath(Ray r, vec2 seed) {
    vec3 accumulated = vec3(0.0);
    vec3 throughput = vec3(1.0);

    for (int bounce = 0; bounce < MAX_BOUNCES; bounce++) {
        float t = 0.0;
        bool hit = false;
        vec3 p;

        for (int i = 0; i < MAX_STEPS; i++) {
            p = r.origin + r.dir * t;
            float d = map(p);
            if (d < HIT_EPSILON) {
                hit = true;
                break;
            }
            if (t > FAR_CLIP) break;
            t += d;
        }

        if (!hit) {
            vec3 skyTop = vec3(0.2, 0.5, 1.0);
            vec3 skyBottom = vec3(1.0, 0.6, 0.3);
            vec3 sky = mix(skyBottom, skyTop, 0.5 + 0.5 * r.dir.y);
            accumulated += throughput * sky;
            break;
        }

        vec3 n = calcNormal(p);
        vec3 base = 0.5 + 0.5 * sin(vec3(p.x * 2.0, p.y * 3.0, p.z * 4.0) + u_time * 1.5);
        r.origin = p + n * 0.001;
        r.dir = randomHemisphere(n, seed + float(bounce));
        throughput *= base * 0.9;
    }

    return accumulated;
}

void main() {
    vec2 coord = gl_FragCoord.xy;
    Ray cam = createCameraRay(coord);

    vec3 color = vec3(0.0);
    for (int i = 0; i < MAX_SAMPLES; i++) {
        vec2 seed = coord + vec2(float(i));
        color += tracePath(cam, seed);
    }

    color /= float(MAX_SAMPLES);
    color = pow(color, vec3(1.0 / 2.2));
    gl_FragColor = vec4(color, 1.0);
}
