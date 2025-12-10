#version 330 core

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14159265359
struct Ray {
    vec3 origin;
    vec3 direction;
};

Ray createCameraRay() {
    float fov = radians(90.0);
    float fx = tan(fov / 2.0) / u_resolution.x;
    vec2 d = (2 * gl_FragCoord.xy - u_resolution.xy) * fx;
    return Ray(vec3(0.0), normalize(vec3(d, 1.0)));
}

void main() {
    Ray cameraRay = createCameraRay();
    vec3 color = mix(vec3(0.1, 0.1, 0.2), vec3(0.1, 0.4, 0.9), max(0.0, 15.0 * cameraRay.direction.y));
    gl_FragColor = vec4(color, 1.0);
}
