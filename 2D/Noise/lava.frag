#version 330 core

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14159265359

float hash(vec3 p3) {
    p3 = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

float hash(float seedX, float seedY, float seedZ) {
    return hash(vec3(seedX, seedY, seedZ));
}

float hash(vec2 seed) {
    return hash(vec3(seed.x, seed.y, fract(seed.x + seed.y)));
}
vec3 hash3(vec3 p3) {
    p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yxx) * p3.zyx);
}
vec3 hash3(float seedX, float seedY, float seedZ) {
    return hash3(vec3(seedX, seedY, seedZ));
}

mat2 rotate(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}
float sin_wave(float ampl, float angle, float frequence, float speed) {
    return ampl * cos(angle * frequence + u_time * PI * speed);
}
float noise(vec2 seed) {
    vec2 i = floor(seed);
    float v00 = hash(i);
    float v10 = hash(i + vec2(1.0, 0.0));
    float v01 = hash(i + vec2(0.0, 1.0));
    float v11 = hash(i + vec2(1.0, 1.0));
    vec2 f = fract(seed);

    vec2 weight = smoothstep(0.0, 1.0, f);

    float x1 = mix(v00, v10, weight.x);
    float x2 = mix(v01, v11, weight.x);
    return mix(x1, x2, weight.y);
}

float lava(vec2 coord, float value) {
    float noise_val = noise(coord + u_time);
    // float wave = sin_wave(1.0, atan(coord.y, coord.x), (coord.x - coord.y) / PI, 0.5);
    float wave = sin_wave(1.0, (noise_val * PI), (coord.x - coord.y), 1.25);
    float wave2 = sin_wave(1.0, (coord.x + coord.y), noise(coord), .05);
    coord = rotate(noise(coord)) * coord;
    float rot_noise = noise(coord);
    float rotTransNoise = noise(coord + vec2(cos(rot_noise), sin(rot_noise)));
    // rotTransNoise = smoothstep(0.1, 1.0, rotTransNoise);
    rotTransNoise = smoothstep(-1.0, 1.0, rotTransNoise * wave);
    noise_val = smoothstep(-1.0, 1.0, noise_val * wave2);
    return smoothstep(0.4, 1.0, noise_val * rotTransNoise);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float lines = lava(30.0 * uv, u_time);
    vec4 color = vec4(1.0, 0.0, 0., .5);
    vec4 color2 = vec4(.0, 1.0, 0.0, .75);
    color = mix(color, color2, lines);
    gl_FragColor = color;
}
