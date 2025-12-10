#version 330

out vec4 fragColor;

// Uniforms
uniform float u_time;
uniform vec2 u_resolution;

uniform vec3 u_cubeCenters[27]; 
uniform vec3 u_cubeOrientations[81]; 

uniform int u_axis;
uniform int u_slice;
uniform float u_angle;
uniform vec2 u_selection; 
uniform float u_expansion; 

uniform float u_camYaw;
uniform float u_camPitch;
uniform vec3 u_targetCenter;
const float MAX_DIST = 1000.0;
const int NUM_CUBES = 27;
const int NUM_LIGHTS = 4;

struct Plane {
    vec3 Point;
    vec3 Normal;
};
struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
};

struct Cube {
    vec3 min_pt; vec3 max_pt; vec3 center;
    vec3 color_pos_x; vec3 color_neg_x;
    vec3 color_pos_y; vec3 color_neg_y;
    vec3 color_pos_z; vec3 color_neg_z;
};

struct Ray
{
vec3 origin;
vec3 dir;
};

float intersectPlane(Ray ray, Plane plane) {
    float denom = dot(plane.Normal, ray.dir);
    if (abs(denom) < 1e-6) return -1.0;
    float t = dot(plane.Normal, plane.Point - ray.origin) / denom;
    if (t < 0.0) return -1.0;
    return t;
}


Cube setupCube(vec3 center, float half_size) {
    Cube c;
    c.center = center;
    c.min_pt = center - vec3(half_size); 
    c.max_pt = center + vec3(half_size);  
    return c;
}

float intersectCube(vec3 rayOrigin, vec3 rayDir, Cube cube, out vec3 normal) {
    vec3 invDir = 1.0 / rayDir;
    vec3 t1 = (cube.min_pt - rayOrigin) * invDir;
    vec3 t2 = (cube.max_pt - rayOrigin) * invDir;
    vec3 t_min = min(t1, t2);
    vec3 t_max = max(t1, t2);
    float t_entry = max(max(t_min.x, t_min.y), t_min.z);
    float t_exit  = min(min(t_max.x, t_max.y), t_max.z);

    if (t_entry < t_exit && t_exit > 0.0) {
        normal = vec3(0.0);
        const float epsilon = 0.0001; 
        if (t_entry > 0.0) {
            if (abs(t_entry - t_min.x) < epsilon) normal.x = (rayDir.x < 0.0) ? 1.0 : -1.0;
            else if (abs(t_entry - t_min.y) < epsilon) normal.y = (rayDir.y < 0.0) ? 1.0 : -1.0;
            else normal.z = (rayDir.z < 0.0) ? 1.0 : -1.0;
            return t_entry;
        } 
        return t_exit; 
    }
    return -1.0;
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

mat3 getCubeRotation(vec3 center, int axis, int slice, float angle) {
    if (angle == 0.0) return mat3(1.0);
    float sliceF = float(slice);
    float eps = 0.25; 
    bool shouldRotate = false;
    vec3 rotationAxis = vec3(0.0);

    if (axis == 0) { if (abs(center.x - sliceF) < eps) { shouldRotate = true; rotationAxis = vec3(1.0, 0.0, 0.0); }}
    else if (axis == 1) { if (abs(center.y - sliceF) < eps) { shouldRotate = true; rotationAxis = vec3(0.0, 1.0, 0.0); }}
    else if (axis == 2) { if (abs(center.z - sliceF) < eps) { shouldRotate = true; rotationAxis = vec3(0.0, 0.0, 1.0); }}

    if (shouldRotate) return rotationAroundAxis(rotationAxis, angle);
    return mat3(1.0);
}

vec3 setupRayOrigin() {
    vec3 rayOrigin = vec3(0.0, 0.0 , -12.0);
    return rayOrigin;
}

vec3 setupRayDirection(vec2 p) {
    vec3 rayDir = normalize(vec3(p.x, p.y, 1.5));
    return rayDir;
}
const float HALF_PI = 1.57079632679;
mat3 setupCameraRotation() {
float pitch_clamped = clamp(u_camPitch, -HALF_PI, HALF_PI);
    mat3 rotX = rotationAroundAxis(vec3(1.0, 0.0, 0.0), pitch_clamped);
    mat3 rotY = rotationAroundAxis(vec3(0.0, 1.0, 0.0), u_camYaw);
    return rotY * rotX;
}

Ray createCameraRay(vec2 p){
  Ray ray;
  mat3 camRot = setupCameraRotation();
  vec3 initialOrigin = setupRayOrigin();
  ray.dir =camRot * setupRayDirection(p);
  vec3 offset = initialOrigin - u_targetCenter;
  ray.origin = u_targetCenter + camRot * offset;
  return ray;
}



bool isCubeHighlighted(vec3 logicalCenter) {
    if (u_selection.x == 0.0 && abs(logicalCenter.x - u_selection.y) < 0.25) return true;
    if (u_selection.x == 1.0 && abs(logicalCenter.y - u_selection.y) < 0.25) return true;
    if (u_selection.x == 2.0 && abs(logicalCenter.z - u_selection.y) < 0.25) return true;
    return false;
}

vec3 getCubeFaceColor(vec3 worldNormal, int i, mat3 rot) {
    int baseIdx = i * 3;
    
    vec3 vecRight = rot * u_cubeOrientations[baseIdx + 0];
    vec3 vecUp    = rot * u_cubeOrientations[baseIdx + 1];
    vec3 vecFront = rot * u_cubeOrientations[baseIdx + 2];

    vec3 vecLeft = -vecRight;
    vec3 vecDown = -vecUp;
    vec3 vecBack = -vecFront;

    int ix = i / 9;
    int iy = (i / 3) % 3;
    int iz = i % 3;
    
    if      (ix == 2 && dot(worldNormal, vecRight) > 0.9) return vec3(0.8, 0.0, 0.0); // red
    else if (ix == 0 && dot(worldNormal, vecLeft)  > 0.9) return vec3(1.0, 0.5, 0.0); // orange
    else if (iy == 2 && dot(worldNormal, vecUp)    > 0.9) return vec3(1.0, 1.0, 0.0); // yellow
    else if (iy == 0 && dot(worldNormal, vecDown)  > 0.9) return vec3(1.0, 1.0, 1.0); // white
    else if (iz == 2 && dot(worldNormal, vecFront) > 0.9) return vec3(0.0, 0.0, 1.0); // blue
    else if (iz == 0 && dot(worldNormal, vecBack)  > 0.9) return vec3(0.0, 1.0, 0.0); // gren
    
    return vec3(0.05); 
}

void traceCubes(
    Ray cameraRay,
    inout float t_min, 
    inout vec3 finalNormal, 
    inout vec3 finalColor,
    inout bool closestHitIsHighlighted
) {
    for (int i = 0; i < NUM_CUBES; ++i) {
        vec3 logicalCenter = u_cubeCenters[i];
        vec3 visualCenter = logicalCenter * u_expansion;

        Cube currentCube = setupCube(visualCenter, 0.45);

        mat3 rot = getCubeRotation(logicalCenter, u_axis, u_slice, u_angle);
        mat3 invRot = transpose(rot);

        vec3 testRayOrigin = invRot * cameraRay.origin;
        vec3 testRayDir    = invRot * cameraRay.dir;
        
        bool isHighlighted = isCubeHighlighted(logicalCenter);

        vec3 hitNormal = vec3(0.0);
        float t = intersectCube(testRayOrigin, testRayDir, currentCube, hitNormal);
        
        if (t > 1e-3 && t < t_min) {
            t_min = t; 
            
            vec3 worldNormal = rot * hitNormal;
            finalNormal = worldNormal; 
            closestHitIsHighlighted = isHighlighted;

            finalColor = getCubeFaceColor(worldNormal, i, rot);
        }
    }
}
vec3 getShadowColor(Ray shadowRay, float distToLight) {
    float closestT = distToLight;
    vec3 resultColor = vec3(-1.0); 
    for (int i = 0; i < NUM_CUBES; ++i) {
        vec3 logicalCenter = u_cubeCenters[i];
        vec3 visualCenter = logicalCenter * u_expansion;
        Cube currentCube = setupCube(visualCenter, 0.45);

        mat3 rot = getCubeRotation(logicalCenter, u_axis, u_slice, u_angle);
        mat3 invRot = transpose(rot);

        vec3 testRayOrigin = invRot * shadowRay.origin;
        vec3 testRayDir    = invRot * shadowRay.dir;

        vec3 hitNormal = vec3(0.0);
        float t = intersectCube(testRayOrigin, testRayDir, currentCube, hitNormal);

        if (t > 1e-3 && t < closestT) {
            closestT = t;
            vec3 worldNormal = rot * hitNormal;
            resultColor = getCubeFaceColor(worldNormal, i, rot);
        }
    }
    return resultColor;
}

vec3 applyLightingAndHighlight(vec3 finalColor, vec3 finalNormal, bool closestHitIsHighlighted, float t_min) {
    if (t_min < MAX_DIST) {
        vec3 litColor = finalColor;
        vec3 lightDir = normalize(vec3(0.5, 1.0, -0.5)); 
        
        float diff = max(dot(finalNormal, lightDir), 0.2); 
        litColor *= diff; 

        if (closestHitIsHighlighted) {
            litColor += vec3(0.2) * (0.6 + 0.4 * sin(u_time * 8.0));
        }
        return litColor;
    }
    return finalColor; 
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
void traceSphere(
  Ray cameraRay,
  Sphere sphere,
    inout float t_min, 
    inout vec3 finalNormal, 
    inout vec3 finalColor,
    inout bool closestHitIsHighlighted
) {
    float t_sphere =intersectSphere(cameraRay,sphere);
    if (t_sphere > 1e-3 && t_sphere < t_min) {
            t_min = t_sphere;

            vec3 hitPoint = cameraRay.origin + cameraRay.dir* t_sphere;
            finalNormal = normalize(hitPoint - sphere.center);
            finalColor = sphere.color; 
            
                vec3 viewDir = normalize(cameraRay.origin- (cameraRay.origin+ cameraRay.dir* t_min));
                vec3 halfwayDir = normalize(normalize(vec3(1.0))+ viewDir);
                float spec = pow(max(dot(finalNormal, halfwayDir), 0.0), 32.0); 
                vec3 specularColor = vec3(1.0) * spec * 0.5; 
    finalColor += specularColor;
      }
  }
void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    Ray cameraRay = createCameraRay(p);
    
    vec3 lightPositions[NUM_LIGHTS];
    lightPositions[0] = vec3(6.0 * sin(u_time * 0.5), 8.0, 6.0 * cos(u_time * 0.5));
    lightPositions[1] = vec3(-6.0, 7.0, -6.0);
    lightPositions[2] = vec3(6.0 * sin(u_time * 0.5 + 3.14), 6.0, 6.0 * cos(u_time * 0.5 + 3.14));
    lightPositions[3] = vec3(5.0, 2.0, 5.0);
    
    Plane plane = Plane(vec3(0.0, -13.0, 0.0), vec3(0.0, 1.0, 0.0));
    
    float t_min = MAX_DIST; 
    vec3 finalNormal = vec3(0.0);
    vec3 finalColor = vec3(0.15);
    bool closestHitIsHighlighted = false;

    traceCubes(cameraRay, t_min, finalNormal, finalColor, closestHitIsHighlighted);

    for(int j = 0; j < NUM_LIGHTS; j++) {
        Sphere s = Sphere(lightPositions[j], 0.4, vec3(1.0));
        float t_sphere = intersectSphere(cameraRay, s);
        if (t_sphere > 1e-3 && t_sphere < t_min) {
            t_min = t_sphere;
            finalNormal = normalize((cameraRay.origin + cameraRay.dir * t_sphere) - s.center);
            finalColor = vec3(1.0,0.5,0.2); 
            closestHitIsHighlighted = false;
        }
    }
    
    if (t_min < MAX_DIST && finalColor.r < 1.5) {
        finalColor = applyLightingAndHighlight(finalColor, finalNormal, closestHitIsHighlighted, t_min);
    }

    float t_plane = intersectPlane(cameraRay, plane);
    
    if (t_plane > 1e-3 && t_plane < t_min) {
        t_min = t_plane;
        vec3 floorPos = cameraRay.origin + cameraRay.dir * t_plane;
        vec3 floorNormal = plane.Normal;
        finalNormal = floorNormal; 

        vec3 totalLight = vec3(0.0);
        vec3 floorBaseColor = vec3(0.3); 

        for(int j = 0; j < NUM_LIGHTS; j++) {
            vec3 lightPos = lightPositions[j];
            vec3 lightVec = lightPos - floorPos;
            float distToLight = length(lightVec);
            vec3 lightDir = normalize(lightVec);

            float NdotL = max(dot(floorNormal, lightDir), 0.0);
            float attenuation = 1.0 / (1.0 + 0.02 * distToLight * distToLight); 
            
            Ray shadowRay;
            shadowRay.origin = floorPos + floorNormal * 0.01; 
            shadowRay.dir = lightDir;

            vec3 projectedColor = getShadowColor(shadowRay, distToLight);

            if (projectedColor.r >= 0.0) {
                totalLight += projectedColor * 15.0 * attenuation; 
            } else {
                totalLight += vec3(1.0,0.5,0.5) * NdotL * attenuation;
            }
        }
        
        finalColor = floorBaseColor + totalLight;
    }
    fragColor = vec4(finalColor, 1.0);
}
