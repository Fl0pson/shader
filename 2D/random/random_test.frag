#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14
#define TWOPI 2.0 * PI
#define THREEPI 3.0 * PI

float random2d(vec2 coord) {
    return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
float sin_wave(float ampl, float angle, float frequence, float speed) {
    return ampl * sin(angle * frequence + u_time * PI * speed);
}
vec2 random_pattern(vec2 uv, float index) {
    float wave = sin_wave(1.0, index, 1.0, 1.0);
    return uv * wave;
}

vec2 rotate(vec2 point, float angle) {
    point = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * point;
    return point;
}

float draw_spiral(vec2 point, float arm_thickness, float angle_scale, float offset, float sharpness) {
    float radius = sqrt(pow(point.x, 2.0) + pow(point.y, 2.0));
    float theta = atan(point.y, point.x) + offset;
    float spiral_radius = arm_thickness + angle_scale * mod(theta, TWOPI / 12.0);
    float distance = abs(radius - spiral_radius);
    return smoothstep(arm_thickness - sharpness, arm_thickness + sharpness, distance);
}

float rand_sign(float seed) {
    return sign(fract(sin(seed * 43758.5453123)) - 0.5);
}
void main() {
    vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;
    float sign = rand_sign(-42.0);
    //   float sign = rand_sign(length(uv));
    //float sign = rand_sign(fract(length(uv)));
    vec2 uv_rot_1 = rotate(uv, step(0.5, random2d(uv * u_time)) * u_time * sign);
    //vec2 uv_rot_1 = rotate(uv, random2d(uv * u_time) * sign);
    float arm_thickness = 0.1;
    float angle_scale = 0.4;
    float sharpness = 0.001;
    float curve = draw_spiral(uv_rot_1, arm_thickness, angle_scale, angle_scale, sharpness);
    float curve2 = draw_spiral(uv_rot_1, arm_thickness, angle_scale, angle_scale * PI, sharpness);
    float curve3 = draw_spiral(uv_rot_1, arm_thickness, angle_scale, angle_scale * PI * 1.5, sharpness);
    float curve4 = draw_spiral(uv_rot_1, arm_thickness, angle_scale, angle_scale * TWOPI, sharpness);

    vec4 color = vec4(0.0);
    color = mix(color,
            vec4(
                0.0,
                0.0,
                1.0,
                sin_wave(2.0, u_time, 0.1, 0.5)),
            1.0 - smoothstep(0.5, 1.0, curve));

    color = mix(color,
            vec4(
                smoothstep(0.0, 1.0, random2d(uv)),
                0.0,
                0.0,
                smoothstep(0.3, 0.7, sin(u_time))
            ),
            1.0 - smoothstep(0.0, 1.0, curve2)
        );

    color = mix(color,
            vec4(
                0.0,
                smoothstep(0.0, 1.0, random2d(uv)),
                0.0,
                smoothstep(0.0, 1.0, cos(u_time))
            ),
            1.0 - smoothstep(0.0, 1.0, curve3)
        );
    color = mix(color,
            vec4(
                smoothstep(0.0, 1.0, random2d(uv)),
                smoothstep(0.0, 1.0, random2d(uv)),
                smoothstep(0.0, 1.0, random2d(uv)),
                smoothstep(0.0, 1.0, cos(u_time))
            ),
            1.0 - smoothstep(0.0, 1.0, curve4)
        );
    gl_FragColor = vec4(color);
}
