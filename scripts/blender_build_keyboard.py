"""Blender script (executed via port 9876) to build & export gaming_keyboard.glb."""
import math
import os
import bpy
import bmesh
from mathutils import Vector

OUT_PATH = "/Users/harshitbisht/Desktop/graphic card/assets/gaming_keyboard.glb"


def reset_scene():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    for name in ("GamingKeyboard",):
        if name in bpy.data.collections:
            col_old = bpy.data.collections[name]
            for obj in list(col_old.all_objects):
                bpy.data.objects.remove(obj, do_unlink=True)
            bpy.data.collections.remove(col_old)


def ensure_collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def link_obj(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


def make_pbr_mat(name, color, metallic=0.0, roughness=0.4, emission=None, emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    if alpha < 1.0:
        mat.blend_method = "BLEND" if hasattr(mat, "blend_method") else "HASHED"
    if emission is not None:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
            bsdf.inputs["Emission Strength"].default_value = emission_strength
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = (*emission, 1.0)
    return mat


def add_beveled_box(name, size, loc, mat, col, bevel_w=0.002, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel_w > 0:
        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=bevel_w,
            segments=2,
            affect="EDGES",
            clamp_overlap=True,
        )
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    link_obj(obj, col)
    return obj


def create_keycap(name, width_u, depth_u, loc, tilt_rad, mat, col):
    """Create sculpted OEM-profile keycap with tapered top & subtle dish."""
    unit = 0.01905  # standard 19.05mm MX key pitch
    gap = 0.0018
    bw = width_u * unit - gap
    bd = depth_u * unit - gap
    tw = bw * 0.76
    td = bd * 0.74
    kh = 0.0105

    bm = bmesh.new()
    # Bottom ring
    v0 = bm.verts.new((-bw / 2, -bd / 2, 0))
    v1 = bm.verts.new((bw / 2, -bd / 2, 0))
    v2 = bm.verts.new((bw / 2, bd / 2, 0))
    v3 = bm.verts.new((-bw / 2, bd / 2, 0))
    # Top ring (slightly shifted back in +Y for sculpted slant)
    y_shift = 0.0008
    v4 = bm.verts.new((-tw / 2, -td / 2 + y_shift, kh))
    v5 = bm.verts.new((tw / 2, -td / 2 + y_shift, kh))
    v6 = bm.verts.new((tw / 2, td / 2 + y_shift, kh))
    v7 = bm.verts.new((-tw / 2, td / 2 + y_shift, kh))

    bm.faces.new((v3, v2, v1, v0))  # bottom
    bm.faces.new((v4, v5, v6, v7))  # top
    bm.faces.new((v0, v1, v5, v4))  # front
    bm.faces.new((v1, v2, v6, v5))  # right
    bm.faces.new((v2, v3, v7, v6))  # back
    bm.faces.new((v3, v0, v4, v7))  # left

    bmesh.ops.bevel(
        bm,
        geom=list(bm.edges),
        offset=0.0014,
        segments=2,
        affect="EDGES",
        clamp_overlap=True,
    )

    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = (tilt_rad, 0, 0)
    obj.data.materials.append(mat)
    link_obj(obj, col)
    return obj


def build_keyboard():
    reset_scene()
    col = ensure_collection("GamingKeyboard")

    # Materials
    mat_chassis = make_pbr_mat("KB_AnodizedBody", (0.065, 0.075, 0.092), metallic=0.88, roughness=0.28)
    mat_bezel = make_pbr_mat("KB_TopBezel", (0.10, 0.115, 0.135), metallic=0.85, roughness=0.26)
    mat_weight = make_pbr_mat("KB_ChampagneWeight", (0.76, 0.70, 0.56), metallic=0.92, roughness=0.22)
    mat_plate = make_pbr_mat("KB_SwitchPlate", (0.18, 0.21, 0.25), metallic=0.75, roughness=0.35)
    mat_rgb_green = make_pbr_mat(
        "KB_RGB_Emerald", (0.46, 0.73, 0.0), metallic=0.0, roughness=0.2,
        emission=(0.46, 0.85, 0.02), emission_strength=4.2
    )
    mat_rgb_cyan = make_pbr_mat(
        "KB_RGB_Cyan", (0.10, 0.78, 0.96), metallic=0.0, roughness=0.2,
        emission=(0.15, 0.82, 0.98), emission_strength=3.6
    )
    mat_cap_dark = make_pbr_mat("KB_Keycap_Dark", (0.045, 0.052, 0.065), metallic=0.05, roughness=0.45)
    mat_cap_mod = make_pbr_mat("KB_Keycap_Mod", (0.085, 0.095, 0.115), metallic=0.08, roughness=0.42)
    mat_cap_green = make_pbr_mat(
        "KB_Keycap_Emerald", (0.36, 0.60, 0.02), metallic=0.1, roughness=0.32,
        emission=(0.25, 0.45, 0.0), emission_strength=0.6
    )
    mat_cap_wasd = make_pbr_mat(
        "KB_Keycap_WASD", (0.08, 0.34, 0.42), metallic=0.15, roughness=0.32,
        emission=(0.12, 0.75, 0.92), emission_strength=0.85
    )
    mat_oled = make_pbr_mat(
        "KB_OLED_Screen", (0.02, 0.04, 0.05), metallic=0.1, roughness=0.1,
        emission=(0.45, 0.85, 0.1), emission_strength=2.5
    )
    mat_cable = make_pbr_mat("KB_ParacordCable", (0.09, 0.10, 0.12), metallic=0.1, roughness=0.75)
    mat_wrist = make_pbr_mat("KB_WristRest", (0.05, 0.055, 0.065), metallic=0.05, roughness=0.62)

    # Parent empty so Three.js can treat as unified group
    root = bpy.data.objects.new("GamingKeyboard_Root", None)
    link_obj(root, col)

    # Typing tilt angle: 6 degrees sloped toward user (-Y is front/user side)
    tilt = math.radians(-6.0)

    # 1. CNC Aluminum Base + Angled Housing (75% TKL: 0.34m x 0.145m)
    body = add_beveled_box("KB_Chassis", (0.344, 0.144, 0.022), (0, 0, 0.015), mat_chassis, col, bevel_w=0.003, rot=(tilt, 0, 0))
    body.parent = root

    # Brushed titanium chamfered upper frame rim
    top_rim = add_beveled_box("KB_TopFrame", (0.336, 0.136, 0.006), (0, -0.001, 0.025), mat_bezel, col, bevel_w=0.0015, rot=(tilt, 0, 0))
    top_rim.parent = root

    # Champagne-titanium rear accent badge bar
    weight_bar = add_beveled_box("KB_WeightBar", (0.260, 0.012, 0.014), (0, 0.068, 0.020), mat_weight, col, bevel_w=0.002, rot=(tilt, 0, 0))
    weight_bar.parent = root

    # Rear rubber/aluminum tilt feet
    for sx in (-0.145, 0.145):
        foot = add_beveled_box(f"KB_Foot_{'L' if sx < 0 else 'R'}", (0.028, 0.024, 0.012), (sx, 0.054, 0.006), mat_weight, col, bevel_w=0.002)
        foot.parent = root

    # 2. Glowing Perimeter Underglow & Switch Diffuser Plate
    underglow = add_beveled_box("KB_RGB_Underglow", (0.340, 0.140, 0.0035), (0, 0, 0.009), mat_rgb_green, col, bevel_w=0.001, rot=(tilt, 0, 0))
    underglow.parent = root

    diffuser_plate = add_beveled_box("KB_RGB_SwitchBed", (0.318, 0.122, 0.003), (0, -0.002, 0.024), mat_rgb_cyan, col, bevel_w=0.0005, rot=(tilt, 0, 0))
    diffuser_plate.parent = root

    # Subtle dark switch plate cutouts frame
    switch_plate = add_beveled_box("KB_SwitchPlate", (0.314, 0.118, 0.002), (0, -0.002, 0.0255), mat_plate, col, bevel_w=0.0005, rot=(tilt, 0, 0))
    switch_plate.parent = root

    # 3. Recessed Mini OLED Screen + Knurled Rotary Knob (top-right corner)
    oled_bezel = add_beveled_box("KB_OLED_Bezel", (0.028, 0.016, 0.005), (0.116, 0.050, 0.0285), mat_chassis, col, bevel_w=0.001, rot=(tilt, 0, 0))
    oled_bezel.parent = root
    oled_screen = add_beveled_box("KB_OLED_Display", (0.022, 0.011, 0.002), (0.116, 0.050, 0.0308), mat_oled, col, bevel_w=0.0003, rot=(tilt, 0, 0))
    oled_screen.parent = root

    # Rotary Volume Knob
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=0.0105, depth=0.013, location=(0.148, 0.049, 0.033))
    knob = bpy.context.active_object
    knob.name = "KB_RotaryKnob"
    knob.rotation_euler = (tilt, 0, 0)
    knob.data.materials.append(mat_weight)
    link_obj(knob, col)
    knob.parent = root

    # 4. Full Sculpted 75% Keycap Matrix
    # Rows from top (+Y) to bottom (-Y)
    unit = 0.01905
    start_x = -0.151
    row_y_top = 0.049

    # Layout definition: list of (row_index, [(name, width_u, mat_type), ...])
    rows = [
        # Row 0: Function row (with gap before OLED/Knob)
        (0, [
            ("Key_Esc", 1.0, "green"),
            ("Key_F1", 1.0, "dark"), ("Key_F2", 1.0, "dark"), ("Key_F3", 1.0, "dark"), ("Key_F4", 1.0, "dark"),
            ("Key_F5", 1.0, "mod"), ("Key_F6", 1.0, "mod"), ("Key_F7", 1.0, "mod"), ("Key_F8", 1.0, "mod"),
            ("Key_F9", 1.0, "dark"), ("Key_F10", 1.0, "dark"), ("Key_F11", 1.0, "dark"), ("Key_F12", 1.0, "dark"),
        ]),
        # Row 1: Number row
        (1, [
            ("Key_Grave", 1.0, "mod"),
            ("Key_1", 1.0, "dark"), ("Key_2", 1.0, "dark"), ("Key_3", 1.0, "dark"), ("Key_4", 1.0, "dark"),
            ("Key_5", 1.0, "dark"), ("Key_6", 1.0, "dark"), ("Key_7", 1.0, "dark"), ("Key_8", 1.0, "dark"),
            ("Key_9", 1.0, "dark"), ("Key_0", 1.0, "dark"), ("Key_Minus", 1.0, "dark"), ("Key_Equal", 1.0, "dark"),
            ("Key_Backspace", 2.0, "mod"), ("Key_Del", 1.0, "mod"),
        ]),
        # Row 2: Top Alpha (QWERTY)
        (2, [
            ("Key_Tab", 1.5, "mod"),
            ("Key_Q", 1.0, "dark"), ("Key_W", 1.0, "wasd"), ("Key_E", 1.0, "dark"), ("Key_R", 1.0, "dark"),
            ("Key_T", 1.0, "dark"), ("Key_Y", 1.0, "dark"), ("Key_U", 1.0, "dark"), ("Key_I", 1.0, "dark"),
            ("Key_O", 1.0, "dark"), ("Key_P", 1.0, "dark"), ("Key_LBr", 1.0, "dark"), ("Key_RBr", 1.0, "dark"),
            ("Key_Backslash", 1.5, "mod"), ("Key_PgUp", 1.0, "mod"),
        ]),
        # Row 3: Home Row (ASDF)
        (3, [
            ("Key_Caps", 1.75, "mod"),
            ("Key_A", 1.0, "wasd"), ("Key_S", 1.0, "wasd"), ("Key_D", 1.0, "wasd"), ("Key_F", 1.0, "dark"),
            ("Key_G", 1.0, "dark"), ("Key_H", 1.0, "dark"), ("Key_J", 1.0, "dark"), ("Key_K", 1.0, "dark"),
            ("Key_L", 1.0, "dark"), ("Key_Semi", 1.0, "dark"), ("Key_Quote", 1.0, "dark"),
            ("Key_Enter", 2.25, "green"), ("Key_PgDn", 1.0, "mod"),
        ]),
        # Row 4: Bottom Alpha (ZXCV)
        (4, [
            ("Key_LShift", 2.25, "mod"),
            ("Key_Z", 1.0, "dark"), ("Key_X", 1.0, "dark"), ("Key_C", 1.0, "dark"), ("Key_V", 1.0, "dark"),
            ("Key_B", 1.0, "dark"), ("Key_N", 1.0, "dark"), ("Key_M", 1.0, "dark"),
            ("Key_Comma", 1.0, "dark"), ("Key_Period", 1.0, "dark"), ("Key_Slash", 1.0, "dark"),
            ("Key_RShift", 1.75, "mod"), ("Key_Up", 1.0, "wasd"), ("Key_End", 1.0, "mod"),
        ]),
        # Row 5: Modifiers & Spacebar
        (5, [
            ("Key_LCtrl", 1.25, "mod"), ("Key_Win", 1.25, "mod"), ("Key_LAlt", 1.25, "mod"),
            ("Key_Space", 6.25, "green"),
            ("Key_RAlt", 1.0, "mod"), ("Key_Fn", 1.0, "mod"), ("Key_RCtrl", 1.0, "mod"),
            ("Key_Left", 1.0, "wasd"), ("Key_Down", 1.0, "wasd"), ("Key_Right", 1.0, "wasd"),
        ]),
    ]

    mat_lookup = {
        "dark": mat_cap_dark,
        "mod": mat_cap_mod,
        "green": mat_cap_green,
        "wasd": mat_cap_wasd,
    }

    for r_idx, keys in rows:
        local_y = row_y_top - r_idx * unit - (0.002 if r_idx > 0 else 0.0)
        cursor_u = 0.0
        for k_name, w_u, m_type in keys:
            center_u = cursor_u + w_u * 0.5
            lx = start_x + center_u * unit
            # Transform tilted plane Y/Z coordinate so keys sit flush on angled plate
            cos_t = math.cos(tilt)
            sin_t = math.sin(tilt)
            base_z = 0.0265
            wy = local_y * cos_t - base_z * sin_t
            wz = local_y * sin_t + base_z * cos_t
            cap = create_keycap(k_name, w_u, 1.0, (lx, wy, wz), tilt, mat_lookup[m_type], col)
            cap.parent = root
            cursor_u += w_u

    # 5. Coiled Aviator USB-C Cable along back-left
    # Straight USB-C plug + straight segment -> coiled loops -> aviator connector -> exit cable
    curve_data = bpy.data.curves.new("KB_Cable_Curve", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = 0.0032
    curve_data.bevel_resolution = 5

    spline = curve_data.splines.new("POLY")
    pts = [
        (-0.105, 0.072, 0.018),
        (-0.105, 0.115, 0.005),
        (-0.085, 0.125, 0.007),
    ]
    # Helical coil loops across X from -0.08 to +0.06 at Y=0.128
    turns = 16
    steps_per_turn = 10
    total_steps = turns * steps_per_turn
    for i in range(total_steps + 1):
        t = i / total_steps
        ang = t * turns * math.pi * 2.0
        cx = -0.080 + t * 0.145
        cy = 0.128 + math.sin(ang) * 0.009
        cz = 0.011 + math.cos(ang) * 0.009
        pts.append((cx, cy, cz))

    pts.extend([
        (0.080, 0.128, 0.006),
        (0.115, 0.128, 0.005),
        (0.145, 0.185, 0.004),
    ])

    spline.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        spline.points[i].co = (*p, 1.0)

    cable_obj = bpy.data.objects.new("KB_CoiledCable", curve_data)
    cable_obj.data.materials.append(mat_cable)
    link_obj(cable_obj, col)
    cable_obj.parent = root

    # Machined metallic aviator connector cylinder
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.008, depth=0.042, location=(0.095, 0.128, 0.009))
    aviator = bpy.context.active_object
    aviator.name = "KB_AviatorConnector"
    aviator.rotation_euler = (0, math.pi / 2, 0)
    aviator.data.materials.append(mat_weight)
    link_obj(aviator, col)
    aviator.parent = root

    # 6. Ergonomic Magnetic Wrist Rest in front (-Y)
    wrist = add_beveled_box("KB_WristRest", (0.344, 0.072, 0.015), (0, -0.118, 0.0075), mat_wrist, col, bevel_w=0.003, rot=(math.radians(-4.0), 0, 0))
    wrist.parent = root
    wrist_accent = add_beveled_box("KB_WristAccent", (0.090, 0.004, 0.004), (0, -0.083, 0.012), mat_rgb_green, col, bevel_w=0.0008)
    wrist_accent.parent = root

    bpy.ops.object.select_all(action="DESELECT")
    for obj in col.all_objects:
        obj.select_set(True)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_PATH,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )
    size_kb = os.path.getsize(OUT_PATH) / 1024.0
    print(f"Exported {OUT_PATH} ({size_kb:.1f} KB), objects={len(bpy.data.objects)}")


build_keyboard()
