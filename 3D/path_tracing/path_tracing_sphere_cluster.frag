#version 330

uniform float u_time;
uniform vec2 u_resolution;

const float PI = 3.14159265;
const int SPHERE_COUNT = 27;
const float sphereRadius = .55;
const float spaceFactor = 4.;
vec3 externalLightPos = vec3(5.0 * sin(u_time * 0.5), 3.0, 2.0 * cos(u_time));
vec3 externalLightColor = vec3(1.2, 0., 0.) * 20.0;
struct Ray {
    vec3 origin;
    vec3 dir;
};

struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
};

Sphere spheres[SPHERE_COUNT];

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 randomHemisphere(vec3 n, vec2 seed) {
    float u = rand(seed);
    float v = rand(seed * 1.37);
    float phi = 6.2831853 * u;
    float cosTheta = sqrt(1.0 - v);
    float sinTheta = sqrt(v);
    vec3 d = vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
    vec3 up = abs(n.z) < 0.999 ? vec3(0, 0, 1) : vec3(1, 0, 0);
    vec3 tangent = normalize(cross(up, n));
    vec3 bitangent = cross(n, tangent);
    return normalize(tangent * d.x + bitangent * d.y + n * d.z);
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

mat3 getRotationAxis() {
    vec3 axis = normalize(vec3(
                sin(u_time * 0.5),
                cos(u_time * 0.5),
                sin(u_time * 0.7)
            ));

    float angle = u_time;
    return rotationAroundAxis(axis, angle);
}

vec3 rand3(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.xxy + p.yzz) * p.zyx);
}

vec3 color_palette(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    return a + b * cos(2.0 * PI * (c * t + d));
}

vec3 getSphereColor(int x, int y, int z) {
    float fx = float(x);
    float fy = float(y);
    float fz = float(z);

    float t = fract(0.23 * fx + 0.37 * fy + 0.41 * fz + 0.05 * u_time);

    vec3 a = vec3(0.5, 0.50, 0.5);
    vec3 b = vec3(0.50, 0.50, 2.50);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0., 0.33, 0.67);

    vec3 color = color_palette(a, b, c, d, t);

    return clamp(color, 0.1, 1.0);
}

void createScene() {
    int index = 0;
    mat3 rotation = mat3(2.0, sin(u_time), 0.5,
            .5, 0.5, cos(u_time),
            cos(u_time) - 2.0, 1.0, 0.5);
    mat3 axisRotation = getRotationAxis();
    // mat3 axisRotation = getRotationAxis() * rotation;
    float sphereSpacing = sin(u_time) * spaceFactor - cos(u_time);
    for (int z = -1; z <= 1; z++) {
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec3 baseCenter = vec3(float(x) * sphereSpacing, float(y) * sphereSpacing, float(z) * sphereSpacing);
                vec3 rotatedCenter = axisRotation * baseCenter;

                bool isCorner = (abs(x) + abs(y) + abs(z) == 3);

                vec3 color = getSphereColor(x, y, z);
                if (isCorner) {
                    float sphereRadius2 = sphereRadius + sin(u_time) + step(0.5, float(x + y + z)) / 2.0;
                    sphereRadius2 = clamp(sphereRadius2, 0.3, sphereRadius2);
                    spheres[index++] = Sphere(rotatedCenter, sphereRadius2, color);
                } else {
                    float sphereRadius2 = sphereRadius + cos(u_time) * step(0.2, float(x + y + z));
                    sphereRadius2 = clamp(sphereRadius2, 0.3, sphereRadius2);
                    spheres[index++] = Sphere(rotatedCenter, sphereRadius2, color);
                }
            }
        }
    }
}

Ray createCameraRay(vec2 coord) {
    float fov = radians(60.0);
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = (2.0 * coord - u_resolution.xy) / u_resolution.y;
    vec3 dir = normalize(vec3(uv.x * aspect, uv.y, 1.0));
    return Ray(vec3(0.0, 0.0, -12.0), dir);
}

float intersectSphere(Ray ray, Sphere s) {
    vec3 oc = ray.origin - s.center;
    float b = dot(oc, ray.dir);
    float c = dot(oc, oc) - s.radius * s.radius;
    float h = b * b - c;
    if (h < 0.0) return -1.0;
    float t = -b - sqrt(h);
    return (t > 0.001) ? t : -1.0;
}

vec3 shade(Sphere s, vec3 point, vec3 viewDir, vec3 lightPos, vec3 lightColor) {
    vec3 normal = normalize(point - s.center);
    vec3 lightDir = normalize(lightPos - point);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 42.0);
    float dist = length(lightPos - point);
    float attenuation = 1.0 / (1.0 + 0.1 * dist * dist);

    vec3 ambient = 0.15 * s.color;
    vec3 diffuse = diff * s.color * lightColor;
    vec3 specular = spec * lightColor;

    return ambient + attenuation * (diffuse + specular);
}
const int MAX_BOUNCES = 8;
vec3 tracePath(Ray ray, vec2 seed) {
    vec3 L = vec3(0.0);
    vec3 throughput = vec3(1.0);

    for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {
        float tMin = 1e9;
        int hitIndex = -1;

        for (int i = 0; i < SPHERE_COUNT; ++i) {
            float t = intersectSphere(ray, spheres[i]);
            if (t > 0.0 && t < tMin) {
                tMin = t;
                hitIndex = i;
            }
        }

        if (hitIndex < 0) {
            vec3 sky = mix(vec3(0.8, 0.9, 1.0), vec3(0.2, 0.3, 0.6), 0.5 * (ray.dir.y + 0.2));
            L += throughput * sky;
            break;
        }

        Sphere hit = spheres[hitIndex];
        vec3 hitPoint = ray.origin + ray.dir * tMin;
        vec3 normal = normalize(hitPoint - hit.center);
        vec3 toLight = normalize(externalLightPos - hitPoint);
        float distToLight = length(externalLightPos - hitPoint);

        bool inShadow = false;
        for (int j = 0; j < SPHERE_COUNT; ++j) {
            float shadowT = intersectSphere(Ray(hitPoint + normal * 0.001, toLight), spheres[j]);
            if (shadowT > 0.0 && shadowT < distToLight) {
                inShadow = true;
                break;
            }
        }

        if (!inShadow) {
            float diff = max(dot(normal, toLight), 0.0);
            vec3 lightContribution = diff * externalLightColor / (distToLight * distToLight);
            L += throughput * hit.color * lightContribution;
        }
        if (hitIndex % 1 ==0) {
            float ior = 1.5;
            float fresnel = pow(1.0 - max(dot(-ray.dir, normal), 0.0), 5.0);

            vec3 reflDir = reflect(ray.dir, normal);
            vec3 refrDir = refract(ray.dir, normal, 1.0 / ior);

            if (rand(seed + vec2(bounce)) < fresnel) {
                ray.dir = normalize(reflDir);
            } else {
                ray.dir = normalize(refrDir);
            }

            ray.origin = hitPoint + ray.dir * 1e-4;
            vec3 tint = exp(-hit.color * .50 * tMin);
            throughput *= tint;
        } else {
            ray.dir = randomHemisphere(normal, seed);
            throughput *= hit.color;
        }
    }

    return L;
}

vec2 hash2(vec2 seed) {
    vec3 p3 = fract(vec3(seed.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 rand2(vec2 seed) {
    return hash2(seed += vec2(0.1));
}

const int SAMPLES_PER_PIXEL = 40;
void main() {
    createScene();
    vec3 color = vec3(0.0);

    for (int i = 0; i < SAMPLES_PER_PIXEL; ++i) {
        vec2 jitter = rand2(gl_FragCoord.xy + float(i));
        Ray ray = createCameraRay(gl_FragCoord.xy + jitter);
        color += tracePath(ray, gl_FragCoord.xy + jitter);
    }

    color /= float(SAMPLES_PER_PIXEL);

    // gl_FragColor = vec4(color, 1.0);
    gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0); //gamma correction
}
