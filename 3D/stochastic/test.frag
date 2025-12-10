#version 330

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_tex0;

const float maxDist = 100.0;
const float epsilon = 0.001;
//spheres
const vec3 sphereCoord = vec3(0.0, 2.0, 0.0);
const vec3 sphereCoord2 = vec3(-1.0, 1.0, -3.0);
const float sphereRadius = 1.0;
const float sphereRadius2 = 0.3;

//gloss
const bool useGloss = false;
const float roughness = 5e-2;
//reflect
const float reflectivity = 0.5;

//deathstar
const float spinModifier = 5e-2;
const vec3 deathStar2Color = vec3(1.0, 0.0, 1.0);

const vec3 camOrigin = vec3(0.0, 1.0, -5.0);
out vec4 fragColor;

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
    float radius = 1.0;
    float centerX = sphereCoord.x;
    float centerZ = sphereCoord.z + 1.5;
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
    matID = 0;
    float d = d0;
    float sphere = sdSphere(p - sphereCoord, sphereRadius);
    float sphere2 = sdSphere(p - sphereCoord2, sphereRadius2);
    if (sphere < d) {
        d = sphere;
        matID = 3;
    }
    if (sphere2 < d) {
        d = sphere2;
        matID = 4;
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

float softShadow(vec3 rayOrigin, vec3 rayDirection, float maxD) {
    float t = 0.02;
    float shadow = 1.0;
    float k = 12.0;

    for (int i = 0; i < 1; i++) {
        if (t > maxD) break;

        float h = distOnlyNoLight(rayOrigin + rayDirection * t);
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
            normal = getNormal(p, .00001);
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
        vec2 uv = sphereUV(point, sphereCoord);
        uv.x += u_time * spinModifier;

        vec3 texColor = texture(u_tex0, fract(uv)).rgb;

        return texColor;
    }

    if (matID == 4) {
        vec2 uv = sphereUV(point, sphereCoord2);
        uv.x += u_time * spinModifier;
        vec3 texColor = texture(u_tex0, fract(uv)).rgb + deathStar2Color;
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
vec4 skyColor(vec3 rayDir) {
    float h = max(rayDir.y, 0.0);
    vec3 sky = mix(vec3(0.2, 0.3, 0.5), vec3(0.6, 0.75, 1.0), h);
    return vec4(sky, 1.0);
}

vec2 hash2(vec2 seed) {
    vec3 p3 = fract(vec3(seed.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}
vec2 rand2(vec2 seed) {
    return hash2(seed += vec2(0.1));
}
vec3 getGlossReflectNormal(vec3 Point, vec3 Normal) {
    vec2 noise = rand2(Point.xz) - 0.5;

    vec3 glossNormal = Normal;
    glossNormal.x += noise.x * roughness;
    glossNormal.z += noise.y * roughness;
    glossNormal = normalize(glossNormal);
    return glossNormal;
}
vec4 rayMarch(Ray primaryRay) {
    vec3 Point, Normal;
    int id;

    if (!marchHit(primaryRay, Point, Normal, id)) {
        return skyColor(primaryRay.dir);
    }

    vec3 reflectDir = reflect(primaryRay.dir, Normal);
    if (useGloss) {
        vec3 glossNormal = getGlossReflectNormal(Point, Normal);
        reflectDir = reflect(primaryRay.dir, glossNormal);
    }
    vec4 baseCol = vec4(shade(Point, Normal, id), 1.0);
    Ray reflectRay;

    //prevent self intersection by adding an offset through epsilon
    reflectRay.origin = Point + Normal * 2.0 * epsilon;
    // reflectRay.origin = Point + Normal;
    reflectRay.dir = reflectDir;
    if (id == 3 || id == 4) {
        return baseCol;
    }
    vec4 reflectColor = skyColor(reflectDir);
    vec3 Point2, Normal2;
    int id2;

    if (marchHit(reflectRay, Point2, Normal2, id2)) {
        reflectColor = vec4(shade(Point2, Normal2, id2), 1.0);
    }

    return mix(baseCol, reflectColor, reflectivity);
}

Ray createCameraRay(vec2 coord) {
    float fov = radians(90.0);
    float fx = tan(fov * 0.5) / u_resolution.x;
    vec2 d = (2.0 * coord - u_resolution) * fx;
    return Ray(vec3(0.0, 1.0, -5.0), normalize(vec3(d, 1.0)));
}

Ray createCameraRayDOF(vec2 coord, vec2 jitter, float focusDistance, float aperture) {
    float fov = radians(90.0);
    float fx = tan(fov * 0.5) / u_resolution.x;

    vec2 d = (2.0 * coord - u_resolution) * fx;
    vec3 dir = normalize(vec3(d, 1.0));

    vec3 focalPoint = camOrigin + dir * focusDistance;

    vec2 lensSample = (rand2(coord + jitter) - 0.5) * aperture;

    vec3 newOrigin = camOrigin + vec3(lensSample.x, lensSample.y, 0.0);

    vec3 newDir = normalize(focalPoint - newOrigin);

    return Ray(newOrigin, newDir);
}

void main() {
    vec2 coord = gl_FragCoord.xy;
    vec4 color = vec4(0.0);
    int sampleCount = 20;

    float focusDist = length(sphereCoord2 - camOrigin);

    float aperture = 0.09;

    for (int i = 0; i < sampleCount; i++) {
        vec2 jitter = rand2(coord) - 0.5;

        Ray r = createCameraRayDOF(coord + jitter, jitter, focusDist, aperture);
        color += rayMarch(r);
    }

    color /= float(sampleCount);
    fragColor = color;
}
