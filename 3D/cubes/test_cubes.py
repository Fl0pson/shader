import math

import moderngl
import numpy as np
import pygame


class RubiksState:
    def __init__(self):
        self.positions = []
        for x in range(-1, 2):
            for y in range(-1, 2):
                for z in range(-1, 2):
                    position = [float(x), float(y), float(z)]
                    self.positions.append(position)
                    if x == 0 and y == 0 and z == 0:
                        self.target_center_index = len(self.positions) - 1
                        self.target_center_position = position
        self.positions = np.array(self.positions, dtype="f4")

        self.orientations = []
        for i in range(27):
            self.orientations.append(
                [
                    [1.0, 0.0, 0.0],
                    [0.0, 1.0, 0.0],
                    [0.0, 0.0, 1.0],
                ]
            )
        self.orientations = np.array(self.orientations, dtype="f4")

    def apply_rotation(self, axis, slice_idx, direction):
        angle = -math.radians(90) * direction
        cos_angle, sin_angle = math.cos(angle), math.sin(angle)

        for i in range(27):
            pos = self.positions[i]
            if abs(pos[axis] - slice_idx) < 0.25:

                if axis == 0:  # Rot X -> updates Y, Z
                    y, z = pos[1], pos[2]
                    pos[1] = y * cos_angle - z * sin_angle
                    pos[2] = y * sin_angle + z * cos_angle
                elif axis == 1:  # Rot Y -> updates X, Z
                    x, z = pos[0], pos[2]
                    pos[0] = x * cos_angle + z * sin_angle
                    pos[2] = -x * sin_angle + z * cos_angle
                elif axis == 2:  # Rot Z -> updates X, Y
                    x, y = pos[0], pos[1]
                    pos[0] = x * cos_angle - y * sin_angle
                    pos[1] = x * sin_angle + y * cos_angle

                for vec in self.orientations[i]:
                    if axis == 0:
                        vy, vz = vec[1], vec[2]
                        vec[1] = vy * cos_angle - vz * sin_angle
                        vec[2] = vy * sin_angle + vz * cos_angle
                    elif axis == 1:
                        vx, vz = vec[0], vec[2]
                        vec[0] = vx * cos_angle + vz * sin_angle
                        vec[2] = -vx * sin_angle + vz * cos_angle
                    elif axis == 2:
                        vx, vy = vec[0], vec[1]
                        vec[0] = vx * cos_angle - vy * sin_angle
                        vec[1] = vx * sin_angle + vy * cos_angle

                pos[:] = [round(v) for v in pos]
                for vec in self.orientations[i]:
                    vec[:] = [round(v) for v in vec]


class GraphicsEngine:
    def __init__(self, targetCenter, width=1920, height=1080):
        self.ctx = moderngl.create_context(require=330)
        self.prog = self.load_shader()
        self.vao = self.create_quad()
        if "u_targetCenter" in self.prog:
            self.prog["u_targetCenter"].value = targetCenter
        if "u_resolution" in self.prog:
            self.prog["u_resolution"].value = (width, height)

    def load_shader(self):
        try:
            with open("cubes1.frag", "r") as f:
                frag_src = f.read()
        except FileNotFoundError:
            raise FileNotFoundError(
                "Could not find 'cubes1.frag'. Please check file path."
            )

        vert_src = """
        #version 330
        in vec2 in_vert;
        void main() { gl_Position = vec4(in_vert, 0.0, 1.0); }
        """
        return self.ctx.program(vertex_shader=vert_src, fragment_shader=frag_src)

    def create_quad(self):
        vertices = np.array(
            [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0],
            dtype="f4",
        )
        vbo = self.ctx.buffer(vertices)
        return self.ctx.vertex_array(self.prog, [(vbo, "2f", "in_vert")])

    def upload_state(self, state: RubiksState):
        if "u_cubeCenters" in self.prog:
            self.prog["u_cubeCenters"].write(state.positions.tobytes())
        if "u_cubeOrientations" in self.prog:
            self.prog["u_cubeOrientations"].write(state.orientations.tobytes())

    def update_uniforms(
        self, time, cam_yaw, cam_pitch, selection, animation_data, expansion
    ):
        if "u_time" in self.prog:
            self.prog["u_time"].value = time
        if "u_camYaw" in self.prog:
            self.prog["u_camYaw"].value = cam_yaw
        if "u_camPitch" in self.prog:
            self.prog["u_camPitch"].value = cam_pitch

        if "u_selection" in self.prog:
            self.prog["u_selection"].value = selection
        if "u_expansion" in self.prog:
            self.prog["u_expansion"].value = expansion
        angle, axis, slice_idx = animation_data
        if "u_angle" in self.prog:
            self.prog["u_angle"].value = angle
        if "u_axis" in self.prog:
            self.prog["u_axis"].value = int(axis)
        if "u_slice" in self.prog:
            self.prog["u_slice"].value = int(slice_idx)

    def render(self):
        self.ctx.clear(0.15, 0.15, 0.15)
        self.vao.render(moderngl.TRIANGLE_STRIP)


class RubiksApp:
    def __init__(self):
        pygame.init()
        pygame.display.set_mode((1920, 1080), pygame.OPENGL | pygame.DOUBLEBUF)
        self.clock = pygame.time.Clock()
        self.running = True

        self.state = RubiksState()
        self.graphics = GraphicsEngine(self.state.target_center_position)

        self.graphics.upload_state(self.state)

        self.cam_yaw = 0.0
        self.cam_pitch = 0.0
        self.mouse_down = False

        self.sel_axis = 0
        self.sel_slice = 1
        self.is_animating = False
        self.anim_start_time = 0
        self.anim_duration = 0.4
        self.current_move_data = None

    def handle_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                self.mouse_down = True
            elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
                self.mouse_down = False
            elif event.type == pygame.MOUSEMOTION and self.mouse_down:
                self.cam_yaw += event.rel[0] * 0.01
                self.cam_pitch += event.rel[1] * 0.01

            elif event.type == pygame.KEYDOWN and not self.is_animating:
                if event.key == pygame.K_d:
                    self.sel_axis = (self.sel_axis + 1) % 3
                elif event.key == pygame.K_a:
                    self.sel_axis = (self.sel_axis - 1) % 3
                elif event.key == pygame.K_w:
                    self.sel_slice += 1
                    if self.sel_slice > 1:
                        self.sel_slice = -1
                elif event.key == pygame.K_s:
                    self.sel_slice -= 1
                    if self.sel_slice < -1:
                        self.sel_slice = 1
                elif event.key == pygame.K_SPACE or event.key == pygame.K_RETURN:
                    mods = pygame.key.get_mods()
                    direction = -1 if (mods & pygame.KMOD_SHIFT) else 1
                    self.trigger_animation(self.sel_axis, self.sel_slice, direction)

    def trigger_animation(self, axis, slice_idx, direction):
        self.is_animating = True
        self.anim_start_time = pygame.time.get_ticks() / 1000.0
        self.current_move_data = (axis, slice_idx, direction)

    def update_logic(self, curr_time):
        current_angle = 0.0
        if self.is_animating:
            elapsed = curr_time - self.anim_start_time

            if elapsed >= self.anim_duration:
                axis, slice_idx, direction = self.current_move_data
                self.state.apply_rotation(axis, slice_idx, direction)

                self.graphics.upload_state(self.state)

                self.is_animating = False
                self.current_move_data = None
                current_angle = 0.0
            else:
                t = elapsed / self.anim_duration
                direction = self.current_move_data[2]
                current_angle = math.radians(90) * direction * t

        return current_angle

    def run(self):
        print("Rubik's Game Started. Controls: WASD to Select, SPACE to Rotate.")
        while self.running:
            time = pygame.time.get_ticks() / 1000.0

            self.handle_input()

            anim_angle = self.update_logic(time)
            expansion = 1.0
            anim_axis = self.current_move_data[0] if self.is_animating else 0
            anim_slice = self.current_move_data[1] if self.is_animating else 0
            if self.is_animating:
                elapsed = time - self.anim_start_time
                progress = min(elapsed / self.anim_duration, 1.0)

                extra_scale = math.sin(progress * math.pi) * 2.8

                expansion = 1.0 + extra_scale
            self.graphics.update_uniforms(
                time=time,
                cam_yaw=self.cam_yaw,
                cam_pitch=self.cam_pitch,
                selection=(float(self.sel_axis), float(self.sel_slice)),
                animation_data=(anim_angle, anim_axis, anim_slice),
                expansion=expansion,
            )

            self.graphics.render()
            pygame.display.flip()
            self.clock.tick(60)


if __name__ == "__main__":
    app = RubiksApp()
    app.run()
