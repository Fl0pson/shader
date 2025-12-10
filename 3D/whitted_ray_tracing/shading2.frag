#version 330

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_sunTexture;

out vec4 fragColor;
const float maxDist = 100.0;
const float epsilon = 0.001;

struct Ray {
    vec3 origin;
    vec3 dir;
};

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdPlane(vec3 p, vec3 n, float h) {
    return dot(p, n) + h;
}
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

vec3 getLightPos() {
    float t = u_time * 0.3;
    t = 0.0;
    float radius = 8.0;
    float centerX = -4.5;
    float centerZ = 15.75;
    float heightOffset = 12.0;
    float heightVariation = 2.5;

    float x = centerX + radius * cos(t);
    float z = centerZ + radius * sin(t);

    float y = heightOffset + heightVariation * sin(t * 0.5);

    return vec3(x, y, z);
}

vec2 sphereUV(vec3 p, vec3 center) {
    vec3 n = normalize(p - center);
    float u = atan(n.z, n.x) / (2.0 * 3.1415926535) + 0.5;
    float v = n.y * 0.5 + 0.5;
    return vec2(u, v);
}
float distFunc(vec3 p, out int matID) {
    float d0 = sdPlane(p, vec3(0, 1, 0), -0.5);
    float sphere = sdSphere(p, 1.5);
    float d = d0;
    matID = 0;

    if (sphere < d) {
        d = sphere;
        matID = 3;
    }

    return d;
}

float distOnly(vec3 p) {
    int dummy;
    return distFunc(p, dummy);
}
float distOnlyNoLight(vec3 p) {
    float d0 = sdPlane(p, vec3(0, 1, 0), -0.5);

    float d = d0;

    return d;
}
vec3 getNormal(vec3 p, float d) {
    vec2 e = vec2(d, 0);
    float dx = distOnly(p + e.xyy) - distOnly(p - e.xyy);
    float dy = distOnly(p + e.yxy) - distOnly(p - e.yxy);
    float dz = distOnly(p + e.yyx) - distOnly(p - e.yyx);
    return normalize(vec3(dx, dy, dz));
}

vec3 getAlbedo(int id) {
    if (id == 0) return vec3(1.0);
    if (id == 1) return vec3(0.9, 0.7, 0.5);
    if (id == 2) return vec3(1.0, 1.0, 0.0);
    return vec3(0.6, 0.9, 0.7);
}

float softShadow(vec3 ro, vec3 rd, float maxD) {
    float t = 0.02;
    float shadow = 1.0;
    float k = 12.0;

    for (int i = 0; i < 100; i++) {
        if (t > maxD) break;

        float h = distOnlyNoLight(ro + rd * t);
        if (h < epsilon) return 0.0;

        shadow = min(shadow, k * h / t);

        t += h;
    }

    return clamp(shadow, 0.0, 1.0);
}

bool marchHit(Ray ray, out vec3 hitPos, out vec3 normal, out int matID) {
    float t = 0.0;
    for (int i = 0; i < 200; i++) {
        vec3 p = ray.origin + ray.dir * t;
        float d = distFunc(p, matID);

        if (d < epsilon) {
            hitPos = p;
            normal = getNormal(p, .0001);
            return true;
        }

        t += d;
        if (t > maxDist) break;
    }
    return false;
}

vec3 shade(vec3 point, vec3 normal, int matID) {
    vec3 lightPos = getLightPos();
    vec3 lightColor = vec3(1.0, 0.5, 0.1);

    if (matID == 3) {
        vec3 lightPos = getLightPos();
        vec2 uv = sphereUV(point, lightPos);
        uv.x += u_time * 0.02;

        vec3 texColor = texture(u_sunTexture, fract(uv)).rgb;

        return texColor;
    }
    vec3 albedo = getAlbedo(matID);

    vec3 toLight = lightPos - point;
    float distToLight = length(toLight);
    vec3 lightDir = normalize(toLight);

    float NdotL = max(dot(normal, lightDir), 0.0);

    float shadow = softShadow(
            point + normal * 0.01,
            lightDir,
            distToLight - 0.01
        );

    vec3 ambient = albedo * 0.15;
    vec3 diffuse = albedo * NdotL * shadow * lightColor;

    return ambient + diffuse;
}
vec3 skyColor(vec3 rayDir) {
    float h = max(rayDir.y, 0.0);
    vec3 sky = mix(vec3(0.2, 0.3, 0.5), vec3(0.6, 0.75, 1.0), h);
    return sky;
}
vec3 rayMarch(Ray primaryRay) {
    vec3 Point, Normal;
    int id;

    if (!marchHit(primaryRay, Point, Normal, id)) {
        return skyColor(primaryRay.dir);
    }

    vec3 baseCol = shade(Point, Normal, id);
    vec3 reflDir = reflect(primaryRay.dir, Normal);
    Ray reflRay;
    //prevent self intersection by adding an offset through epsilon
    reflRay.origin = Point + Normal * 2.0 * epsilon;
    reflRay.dir = reflDir;

    vec3 reflCol = vec3(0.2);
    vec3 Point2, Normal2;
    int id2;

    if (marchHit(reflRay, Point2, Normal2, id2)) {
        reflCol = shade(Point2, Normal2, id2);
    }

    float reflectivity = 0.1;
    return mix(baseCol, reflCol, reflectivity);
}

Ray createCameraRay(vec2 coord) {
    float fov = radians(90.0);
    float fx = tan(fov * 0.5) / u_resolution.x;
    vec2 d = (2.0 * coord - u_resolution) * fx;
    return Ray(vec3(0.0, 1.0, -5.0), normalize(vec3(d, 1.0)));
}

void main() {
    vec2 coord = gl_FragCoord.xy;
    Ray cameraRay = createCameraRay(coord);
    vec3 color = rayMarch(cameraRay);
    fragColor = vec4(color, 1.0);
}
