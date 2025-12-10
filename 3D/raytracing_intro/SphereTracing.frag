#version 330
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
const float EPSILON = 1e-4;
const int numSpheres = 5;
struct Ray
{
    vec3 origin;
    vec3 dir;
};

struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
    bool isLight;
};
Ray createCameraRay(vec2 coord) {
    float fov = radians(90.0);
    float fx = tan(fov / 2.0) / u_resolution.x;
    vec2 d = (2.0 * coord - u_resolution) * fx;
    return Ray(vec3(0.0), normalize(vec3(d, 1.0)));
}

float intersect_sphere(Ray ray, Sphere sphere) {
    vec3 oc = ray.origin - sphere.center;

    float a = dot(ray.dir, ray.dir);
    float b = 2.0 * dot(oc, ray.dir);
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

vec3 sphereNormal(Sphere sphere, vec3 point) {
    return normalize(point - sphere.center);
}

struct HitPoint {
    float t;
    int hit;
};
HitPoint multipleSpheres(Sphere[numSpheres] spheres, Ray cameraRay) {
    vec3 color = vec3(0.0);
    float closestT = 1e20;
    int hit = -1;
    for (int i = 0; i < numSpheres; i++) {
        float t = intersect_sphere(cameraRay, spheres[i]);
        if (t < closestT && t > 0.0) {
            closestT = t;
            hit = i;
        }
    }

    HitPoint hp;
    hp.t = closestT;
    hp.hit = hit;
    return hp;
}

vec3 colorPoint(HitPoint hit, Sphere sphere, Ray cameraRay, Sphere lightSource) {
    vec3 color = vec3(0.0);
    if (hit.hit == -1) return vec3(0.0);
    vec3 hitPoint = cameraRay.origin + hit.t * cameraRay.dir;
    vec3 normal = sphereNormal(sphere, hitPoint);
    vec3 lightDir = normalize(lightSource.center - sphere.center);
    float diffuse = max(0.0, dot(normal, lightDir));
    if (sphere.isLight) {
        color = sphere.color;
    }
    else {
        color = mix(sphere.color, lightSource.color, cos(u_time));
        color = color * diffuse;
    }

    return color;
}

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
struct Plane {
    vec3 Point;
    vec3 Normal;
};
float intersectPlane(Ray ray, Plane plane) {
    float denom = dot(plane.Normal, ray.dir);
    if (abs(denom) < 1e-6) return -1.0;
    float t = dot(plane.Normal, plane.Point - ray.origin) / denom;
    if (t < 0.0) return -1.0;
    return t;
}

float fogFactor(float distance, float fogNear, float fogFar) {
    return clamp((distance - fogNear) / (fogFar - fogNear), 0.0, 1.0);
}
void main()
{
    Ray cameraRay = createCameraRay(gl_FragCoord.xy);
    Sphere spheres[numSpheres];
    spheres[0] = Sphere(vec3(0.0, 0.0, 5.0), 0.5, vec3(1.0, 1.0, 0.0), true); //pivot; yellow
    mat3 blueRot = rotationAroundAxis(vec3(1.0, 1.0, 1.0), .5 * u_time);
    spheres[1] = Sphere(vec3(0.0, 0.0, 5.0) + blueRot * vec3(3., 0.0, 0.0), 0.5, vec3(0.0, 0.0, 1.0), false); //blue

    mat3 whiteRedRot = rotationAroundAxis(vec3(0.0, 1.0, 0.0), 1.5 * u_time);
    vec3 whiteVec = whiteRedRot * vec3(3.0, .0, 0.0);
    vec3 redVec = whiteRedRot * vec3(-3.0, .0, 0.0);
    spheres[2] = Sphere(vec3(0.0, 0.0, 5.0) + whiteVec, .5, vec3(1.0), false); //white
    spheres[3] = Sphere(vec3(0.0, 0.0, 5.0) + redVec, 0.5, vec3(1.0, 0., 0.), false); //red

    mat3 greenRot = rotationAroundAxis(vec3(0.0, 1.0, 1.0), 1.5 * u_time);
    vec3 greenVec = greenRot * vec3(2.0, 0.0, 2.0);
    spheres[4] = Sphere(vec3(0.0, 0.0, 5.0) + greenVec, 0.5, vec3(0., 1.0, 0.0), false); //green
    Plane plane = Plane(vec3(0.0, -1.0, 0.0), vec3(0.0, 1.0, 0.0));

    HitPoint hit = multipleSpheres(spheres, cameraRay);
    float t = intersectPlane(cameraRay, plane);

    vec3 color = vec3(0.1, 0.1, 0.2);
    bool hitSphere = hit.hit != -1;
    bool hitPlane = (t > 0.0);
    if (hitSphere && (!hitPlane || hit.hit < t)) {
        color = colorPoint(hit, spheres[hit.hit], cameraRay, spheres[0]);
    }
    else if (hitPlane) {
        vec3 hitPoint = cameraRay.origin + t * cameraRay.dir;
        float checker = mod(floor(hitPoint.x) + floor(hitPoint.z), 2.0);
        vec3 planeColor = mix(vec3(1.0), vec3(0.3), checker);
        color = planeColor;
    }
    vec3 fogColor = vec3(0.1, 0.2, 0.2);
    float distance = 0.0;
    if (hit.hit != -1)
        distance = hit.t;
    else if (t > 0.0)
        distance = t;
    else
        distance = 50.0;
    float fogAmount = fogFactor(distance, 5.0, 12.0);
    color = mix(color, fogColor, fogAmount);
    gl_FragColor = vec4(color, 1.0);
}
