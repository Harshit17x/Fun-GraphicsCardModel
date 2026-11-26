"""Blender script (executed via port 9876) to build & export lab_workstation.glb."""
import math
import os
import bpy
import bmesh

OUT_PATH = "/Users/harshitbisht/Desktop/graphic card/assets/lab_workstation.glb"
TEX_ULTRAWIDE = "/Users/harshitbisht/Desktop/graphic card/assets/monitor_ultrawide_ui.jpg"
TEX_SIDE = "/Users/harshitbisht/Desktop/graphic card/assets/monitor_side_ui.jpg"
TEX_DESKMAT = "/Users/harshitbisht/Desktop/graphic card/assets/lab_deskmat_art.jpg"


def reset_scene():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    for name in ("LabWorkstation",):
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
    if alpha < 1.0 and hasattr(mat, "blend_method"):
        mat.blend_method = "BLEND"
    if emission is not None and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def make_textured_screen_mat(name, image_path, emissive_strength=1.45, roughness=0.14):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.05

    tex_node = nodes.new("ShaderNodeTexImage")
    img = bpy.data.images.load(image_path, check_existing=True)
    tex_node.image = img
    links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
    if emissive_strength > 0 and "Emission Color" in bsdf.inputs:
        links.new(tex_node.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = emissive_strength
    return mat


def add_beveled_box(name, size, loc, mat, col, bevel_w=0.004, rot=(0, 0, 0), parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel_w > 0:
        bmesh.ops.bevel(
            bm, geom=list(bm.edges), offset=bevel_w, segments=2, affect="EDGES", clamp_overlap=True
        )
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    link_obj(obj, col)
    if parent:
        obj.parent = parent
    return obj


def add_uv_plane(name, width, height, loc, rot, mat, col, parent=None, curve_radius=0.0):
    """Create UV-mapped flat or horizontally curved screen plane facing -Y in local space."""
    segs_x = 18 if curve_radius > 0 else 1
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.verify()

    verts_grid = []
    for ix in range(segs_x + 1):
        u = ix / segs_x
        x_flat = (u - 0.5) * width
        if curve_radius > 0:
            ang = x_flat / curve_radius
            px = math.sin(ang) * curve_radius
            py = -(curve_radius - math.cos(ang) * curve_radius)
        else:
            px = x_flat
            py = 0.0
        v_bot = bm.verts.new((px, py, -height / 2))
        v_top = bm.verts.new((px, py, height / 2))
        verts_grid.append((v_bot, v_top, u))

    for ix in range(segs_x):
        vb0, vt0, u0 = verts_grid[ix]
        vb1, vt1, u1 = verts_grid[ix + 1]
        # Face normal toward -Y (viewer)
        face = bm.faces.new((vb0, vb1, vt1, vt0))
        uvs = [(u0, 0.0), (u1, 0.0), (u1, 1.0), (u0, 1.0)]
        for loop, uv in zip(face.loops, uvs):
            loop[uv_layer].uv = uv

    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    link_obj(obj, col)
    if parent:
        obj.parent = parent
    return obj


def add_uv_top_plane(name, width, depth, loc, mat, col, parent=None):
    """Horizontal UV-mapped quad facing +Z (desk mat art)."""
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.verify()
    v0 = bm.verts.new((-width / 2, -depth / 2, 0))
    v1 = bm.verts.new((width / 2, -depth / 2, 0))
    v2 = bm.verts.new((width / 2, depth / 2, 0))
    v3 = bm.verts.new((-width / 2, depth / 2, 0))
    face = bm.faces.new((v0, v1, v2, v3))
    for loop, uv in zip(face.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop[uv_layer].uv = uv
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.data.materials.append(mat)
    link_obj(obj, col)
    if parent:
        obj.parent = parent
    return obj


def build_curved_monitor_shell(name, width, height, depth, curve_radius, loc, rot, mat_frame, mat_rgb, col, parent):
    """Curved bezel backing behind the UV screen."""
    segs_x = 18
    bm = bmesh.new()
    back_verts = []
    front_verts = []
    for ix in range(segs_x + 1):
        u = ix / segs_x
        x_flat = (u - 0.5) * width
        ang = x_flat / curve_radius
        px = math.sin(ang) * curve_radius
        py = -(curve_radius - math.cos(ang) * curve_radius)
        nx = math.sin(ang)
        ny = math.cos(ang)
        # Front bezel perimeter sits behind screen (+ny * 0.002), back sits further (+ny * depth)
        fb = bm.verts.new((px + nx * 0.002, py + ny * 0.002, -height / 2))
        ft = bm.verts.new((px + nx * 0.002, py + ny * 0.002, height / 2))
        bb = bm.verts.new((px + nx * depth, py + ny * depth, -height / 2 + 0.006))
        bt = bm.verts.new((px + nx * depth, py + ny * depth, height / 2 - 0.006))
        front_verts.append((fb, ft))
        back_verts.append((bb, bt))

    for ix in range(segs_x):
        fb0, ft0 = front_verts[ix]
        fb1, ft1 = front_verts[ix + 1]
        bb0, bt0 = back_verts[ix]
        bb1, bt1 = back_verts[ix + 1]
        bm.faces.new((fb0, ft0, ft1, fb1))
        bm.faces.new((bb1, bt1, bt0, bb0))
        bm.faces.new((ft0, bt0, bt1, ft1))
        bm.faces.new((fb1, bb1, bb0, fb0))
    # Caps
    bm.faces.new((front_verts[0][0], back_verts[0][0], back_verts[0][1], front_verts[0][1]))
    bm.faces.new((front_verts[-1][1], back_verts[-1][1], back_verts[-1][0], front_verts[-1][0]))

    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat_frame)
    link_obj(obj, col)
    obj.parent = parent

    # Ambient bias glow bar on rear
    bias = add_beveled_box(name + "_BiasRGB", (width * 0.55, 0.006, 0.012), (0, depth + 0.012, 0), mat_rgb, col, bevel_w=0.002, parent=obj)
    return obj


def build_workstation():
    reset_scene()
    col = ensure_collection("LabWorkstation")

    # Materials
    mat_desk_top = make_pbr_mat("WS_DeskCarbon", (0.055, 0.062, 0.075), metallic=0.25, roughness=0.42)
    mat_titanium = make_pbr_mat("WS_TitaniumTrim", (0.72, 0.67, 0.55), metallic=0.88, roughness=0.26)
    mat_steel = make_pbr_mat("WS_PowderSteel", (0.09, 0.10, 0.12), metallic=0.78, roughness=0.35)
    mat_aluminum = make_pbr_mat("WS_BrushedAlum", (0.64, 0.68, 0.74), metallic=0.86, roughness=0.28)
    mat_glass = make_pbr_mat("WS_TemperedGlass", (0.75, 0.90, 0.96), metallic=0.1, roughness=0.05, alpha=0.20)
    mat_rgb_green = make_pbr_mat(
        "WS_RGB_Green", (0.46, 0.75, 0.0), metallic=0.0, roughness=0.2,
        emission=(0.46, 0.85, 0.02), emission_strength=3.6
    )
    mat_rgb_cyan = make_pbr_mat(
        "WS_RGB_Cyan", (0.12, 0.78, 0.96), metallic=0.0, roughness=0.2,
        emission=(0.15, 0.84, 0.98), emission_strength=3.2
    )
    mat_chair_leather = make_pbr_mat("WS_ChairLeather", (0.045, 0.050, 0.058), metallic=0.05, roughness=0.58)
    mat_chair_accent = make_pbr_mat("WS_ChairAccent", (0.38, 0.62, 0.02), metallic=0.1, roughness=0.45)

    mat_screen_uw = make_textured_screen_mat("WS_Screen_Ultrawide", TEX_ULTRAWIDE, emissive_strength=1.55)
    mat_screen_side = make_textured_screen_mat("WS_Screen_Side", TEX_SIDE, emissive_strength=1.50)
    mat_deskmat = make_textured_screen_mat("WS_DeskMat_Art", TEX_DESKMAT, emissive_strength=0.18, roughness=0.78)

    root = bpy.data.objects.new("LabWorkstation_Root", None)
    link_obj(root, col)

    desk_h = 0.755
    desk_w = 2.08
    desk_d = 0.88

    # =========================================================================
    # 1. Architectural Command Desk
    # =========================================================================
    add_beveled_box("Lab_DeskTop", (desk_w, desk_d, 0.036), (0, 0, desk_h - 0.018), mat_desk_top, col, bevel_w=0.008, parent=root)
    # Brushed titanium edge trim along front & sides
    add_beveled_box("Lab_DeskTrimFront", (desk_w + 0.008, 0.012, 0.020), (0, -desk_d / 2 - 0.002, desk_h - 0.018), mat_titanium, col, bevel_w=0.002, parent=root)
    # Under-desk emerald LED rail
    add_beveled_box("Lab_DeskUnderLED", (desk_w * 0.82, 0.018, 0.008), (0, desk_d / 2 - 0.06, desk_h - 0.040), mat_rgb_green, col, bevel_w=0.002, parent=root)
    add_beveled_box("Lab_DeskFrontLED", (desk_w * 0.56, 0.008, 0.008), (0, -desk_d / 2 + 0.01, desk_h - 0.040), mat_rgb_cyan, col, bevel_w=0.001, parent=root)

    # Trapezoid steel desk legs & crossbeam
    for sx in (-0.88, 0.88):
        side_name = "L" if sx < 0 else "R"
        # Bottom runner foot
        add_beveled_box(f"Lab_LegFoot_{side_name}", (0.07, 0.72, 0.035), (sx, 0.02, 0.0175), mat_steel, col, bevel_w=0.004, parent=root)
        # Front angled strut
        add_beveled_box(f"Lab_LegFront_{side_name}", (0.055, 0.075, desk_h - 0.05), (sx, -0.22, desk_h * 0.5), mat_steel, col, bevel_w=0.004, rot=(math.radians(10), 0, 0), parent=root)
        # Rear vertical column
        add_beveled_box(f"Lab_LegRear_{side_name}", (0.065, 0.085, desk_h - 0.05), (sx, 0.25, desk_h * 0.5), mat_steel, col, bevel_w=0.004, parent=root)
        # Top bracket
        add_beveled_box(f"Lab_LegTop_{side_name}", (0.07, 0.72, 0.028), (sx, 0.02, desk_h - 0.048), mat_steel, col, bevel_w=0.003, parent=root)

    # Rear modesty / cable management channel
    add_beveled_box("Lab_CableTray", (1.64, 0.12, 0.09), (0, 0.26, desk_h - 0.11), mat_steel, col, bevel_w=0.005, parent=root)

    # =========================================================================
    # 2. Custom Blueprint Desk Mat (with image-generator texture!)
    # =========================================================================
    mat_x, mat_y = -0.10, -0.12
    mat_w, mat_d = 0.94, 0.44
    add_beveled_box("Lab_DeskMatBase", (mat_w, mat_d, 0.004), (mat_x, mat_y, desk_h + 0.002), mat_desk_top, col, bevel_w=0.001, parent=root)
    add_uv_top_plane("Lab_DeskMatSurface", mat_w - 0.008, mat_d - 0.008, (mat_x, mat_y, desk_h + 0.0045), mat_deskmat, col, parent=root)
    # Glowing stitched RGB perimeter around desk mat
    add_beveled_box("Lab_DeskMatGlow_F", (mat_w + 0.004, 0.004, 0.003), (mat_x, mat_y - mat_d / 2, desk_h + 0.002), mat_rgb_green, col, bevel_w=0.0005, parent=root)
    add_beveled_box("Lab_DeskMatGlow_B", (mat_w + 0.004, 0.004, 0.003), (mat_x, mat_y + mat_d / 2, desk_h + 0.002), mat_rgb_green, col, bevel_w=0.0005, parent=root)
    add_beveled_box("Lab_DeskMatGlow_L", (0.004, mat_d + 0.004, 0.003), (mat_x - mat_w / 2, mat_y, desk_h + 0.002), mat_rgb_green, col, bevel_w=0.0005, parent=root)
    add_beveled_box("Lab_DeskMatGlow_R", (0.004, mat_d + 0.004, 0.003), (mat_x + mat_w / 2, mat_y, desk_h + 0.002), mat_rgb_green, col, bevel_w=0.0005, parent=root)

    # =========================================================================
    # 3. Triple-Monitor Command Rig (Center Curved Ultrawide + Side Wings)
    # =========================================================================
    stand_x, stand_y = -0.10, 0.27
    # Heavy CNC Aluminum Desk Clamp & Pillar
    add_beveled_box("Lab_MonClamp", (0.14, 0.10, 0.032), (stand_x, stand_y + 0.08, desk_h + 0.016), mat_steel, col, bevel_w=0.004, parent=root)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.024, depth=0.44, location=(stand_x, stand_y + 0.09, desk_h + 0.22))
    pillar = bpy.context.active_object
    pillar.name = "Lab_MonPillar"
    pillar.data.materials.append(mat_aluminum)
    link_obj(pillar, col)
    pillar.parent = root

    # Horizontal articulated cross-bar
    add_beveled_box("Lab_MonCrossBar", (1.08, 0.030, 0.028), (stand_x, stand_y + 0.03, desk_h + 0.28), mat_steel, col, bevel_w=0.004, parent=root)

    # Center Curved Ultrawide Monitor (0.86m x 0.38m)
    mon_c_z = desk_h + 0.285
    build_curved_monitor_shell("Lab_Monitor_CenterShell", 0.88, 0.40, 0.034, 1.45, (stand_x, stand_y - 0.06, mon_c_z), (0, 0, 0), mat_steel, mat_rgb_green, col, root)
    add_uv_plane("Lab_Monitor_CenterScreen", 0.855, 0.375, (stand_x, stand_y - 0.06, mon_c_z), (0, 0, 0), mat_screen_uw, col, parent=root, curve_radius=1.45)

    # Left Vertical 9:16 Telemetry Monitor
    mon_l_loc = (stand_x - 0.56, stand_y - 0.14, desk_h + 0.31)
    mon_l_rot = (0, 0, math.radians(-26))
    add_beveled_box("Lab_Monitor_LeftFrame", (0.30, 0.024, 0.51), mon_l_loc, mat_steel, col, bevel_w=0.004, rot=mon_l_rot, parent=root)
    # Screen offset slightly along rotated local -Y
    l_off_x = math.sin(math.radians(-26)) * 0.013
    l_off_y = -math.cos(math.radians(-26)) * 0.013
    add_uv_plane("Lab_Monitor_LeftScreen", 0.28, 0.49, (mon_l_loc[0] + l_off_x, mon_l_loc[1] + l_off_y, mon_l_loc[2]), mon_l_rot, mat_screen_side, col, parent=root)

    # Right Angled Cluster Monitor
    mon_r_loc = (stand_x + 0.58, stand_y - 0.13, desk_h + 0.29)
    mon_r_rot = (0, 0, math.radians(24))
    add_beveled_box("Lab_Monitor_RightFrame", (0.48, 0.024, 0.32), mon_r_loc, mat_steel, col, bevel_w=0.004, rot=mon_r_rot, parent=root)
    r_off_x = math.sin(math.radians(24)) * 0.013
    r_off_y = -math.cos(math.radians(24)) * 0.013
    add_uv_plane("Lab_Monitor_RightScreen", 0.46, 0.30, (mon_r_loc[0] + r_off_x, mon_r_loc[1] + r_off_y, mon_r_loc[2]), mon_r_rot, mat_screen_uw, col, parent=root)

    # =========================================================================
    # 4. Panoramic Glass Liquid-Cooled Gaming/AI PC Workstation Tower
    # =========================================================================
    pc_root = bpy.data.objects.new("Lab_PC_Tower", None)
    pc_root.location = (0.76, 0.02, desk_h)
    pc_root.rotation_euler = (0, 0, math.radians(16))
    link_obj(pc_root, col)
    pc_root.parent = root

    pc_w, pc_d, pc_h = 0.285, 0.465, 0.46
    # Bottom plinth & Top radiator vent cap
    add_beveled_box("PC_BottomBase", (pc_w, pc_d, 0.032), (0, 0, 0.016), mat_steel, col, bevel_w=0.004, parent=pc_root)
    add_beveled_box("PC_TopCap", (pc_w, pc_d, 0.034), (0, 0, pc_h - 0.017), mat_steel, col, bevel_w=0.004, parent=pc_root)
    # Right side dual-chamber aluminum spine & back panel
    add_beveled_box("PC_RightPanel", (0.065, pc_d, pc_h - 0.05), (pc_w / 2 - 0.0325, 0, pc_h / 2), mat_steel, col, bevel_w=0.003, parent=pc_root)
    add_beveled_box("PC_RearPanel", (pc_w, 0.022, pc_h - 0.05), (0, pc_d / 2 - 0.011, pc_h / 2), mat_steel, col, bevel_w=0.003, parent=pc_root)
    # Corner structural trim strip
    add_beveled_box("PC_CornerLED", (0.012, 0.012, pc_h - 0.05), (-pc_w / 2 + 0.008, -pc_d / 2 + 0.008, pc_h / 2), mat_rgb_green, col, bevel_w=0.001, parent=pc_root)

    # Wraparound Tempered Glass Left & Front Panels
    add_beveled_box("PC_GlassLeft", (0.005, pc_d - 0.025, pc_h - 0.065), (-pc_w / 2 + 0.004, -0.005, pc_h / 2), mat_glass, col, bevel_w=0.001, parent=pc_root)
    add_beveled_box("PC_GlassFront", (pc_w - 0.075, 0.005, pc_h - 0.065), (-0.03, -pc_d / 2 + 0.004, pc_h / 2), mat_glass, col, bevel_w=0.001, parent=pc_root)

    # Motherboard & Internal Components
    add_beveled_box("PC_Motherboard", (0.014, 0.30, 0.32), (0.048, 0.04, 0.24), mat_desk_top, col, bevel_w=0.002, parent=pc_root)
    # CPU Liquid Block with glowing emerald ring
    add_beveled_box("PC_CPUBlock", (0.035, 0.075, 0.075), (0.026, 0.05, 0.29), mat_titanium, col, bevel_w=0.004, parent=pc_root)
    add_beveled_box("PC_CPUGlow", (0.008, 0.055, 0.055), (0.006, 0.05, 0.29), mat_rgb_cyan, col, bevel_w=0.002, parent=pc_root)
    # 4x Glowing DDR5 RAM Sticks
    for i in range(4):
        add_beveled_box(f"PC_RAM_{i}", (0.032, 0.008, 0.115), (0.028, -0.025 - i * 0.014, 0.295), mat_rgb_green, col, bevel_w=0.001, parent=pc_root)

    # Internal Flagship RTX 4090 GPU inside PC Tower
    add_beveled_box("PC_GPU_Body", (0.135, 0.305, 0.058), (-0.025, -0.01, 0.165), mat_titanium, col, bevel_w=0.005, parent=pc_root)
    add_beveled_box("PC_GPU_CorePlate", (0.125, 0.285, 0.042), (-0.028, -0.01, 0.165), mat_desk_top, col, bevel_w=0.003, parent=pc_root)
    add_beveled_box("PC_GPU_GlowBar", (0.008, 0.11, 0.014), (-0.092, -0.04, 0.175), mat_rgb_green, col, bevel_w=0.001, parent=pc_root)
    # 12VHPWR braided cable curve from GPU to PSU chamber
    add_beveled_box("PC_GPU_PowerCable", (0.036, 0.022, 0.065), (-0.055, -0.06, 0.140), mat_steel, col, bevel_w=0.005, rot=(0, math.radians(24), 0), parent=pc_root)

    # Glowing Liquid Cooling Reservoir & Hardline Coolant Tubes
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.032, depth=0.21, location=(0.015, -0.145, 0.23))
    res = bpy.context.active_object
    res.name = "PC_Reservoir"
    res.data.materials.append(mat_rgb_cyan)
    link_obj(res, col)
    res.parent = pc_root

    # Rigid liquid cooling lines connecting reservoir <-> CPU block <-> top radiator
    add_beveled_box("PC_Tube_1", (0.012, 0.19, 0.012), (0.015, -0.05, 0.31), mat_rgb_cyan, col, bevel_w=0.004, parent=pc_root)
    add_beveled_box("PC_Tube_2", (0.012, 0.012, 0.11), (0.020, 0.045, 0.365), mat_rgb_green, col, bevel_w=0.004, parent=pc_root)

    # 3x Side Intake RGB Fan Halos (mounted vertically along inner spine)
    for fi, fz in enumerate((0.12, 0.23, 0.34)):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.048, minor_radius=0.0045, major_segments=24, minor_segments=8,
            location=(0.062, 0.145, fz), rotation=(0, math.pi / 2, 0)
        )
        sfan = bpy.context.active_object
        sfan.name = f"PC_SideFanRing_{fi}"
        sfan.data.materials.append(mat_rgb_cyan)
        link_obj(sfan, col)
        sfan.parent = pc_root

    # 3x Top Radiator RGB Fan Halos
    for fi, fy in enumerate((-0.12, 0.0, 0.12)):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.052, minor_radius=0.005, major_segments=24, minor_segments=8,
            location=(-0.035, fy, pc_h - 0.042)
        )
        fan_ring = bpy.context.active_object
        fan_ring.name = f"PC_TopFanRing_{fi}"
        fan_ring.data.materials.append(mat_rgb_green)
        link_obj(fan_ring, col)
        fan_ring.parent = pc_root

    # =========================================================================
    # 5. Pro Wireless Gaming Mouse & Charging Dock
    # =========================================================================
    mouse = add_beveled_box("Lab_Mouse", (0.062, 0.118, 0.034), (0.24, -0.14, desk_h + 0.021), mat_steel, col, bevel_w=0.014, rot=(0, 0, math.radians(-8)), parent=root)
    add_beveled_box("Lab_MouseScroll", (0.008, 0.020, 0.010), (0, -0.032, 0.015), mat_rgb_green, col, bevel_w=0.002, parent=mouse)

    # =========================================================================
    # 6. Ergonomic Cyber-Pro Gaming Chair (Angled cleanly beside desk)
    # =========================================================================
    chair = bpy.data.objects.new("Lab_GamingChair", None)
    chair.location = (-0.12, -0.82, 0)
    chair.rotation_euler = (0, 0, math.radians(16))
    link_obj(chair, col)
    chair.parent = root

    # 5-star brushed aluminum caster base
    bpy.ops.mesh.primitive_cylinder_add(vertices=18, radius=0.036, depth=0.36, location=(0, 0, 0.25))
    cyl = bpy.context.active_object
    cyl.name = "Chair_GasLift"
    cyl.data.materials.append(mat_aluminum)
    link_obj(cyl, col)
    cyl.parent = chair

    for i in range(5):
        ang = (i / 5.0) * math.pi * 2.0
        lx = math.cos(ang) * 0.17
        ly = math.sin(ang) * 0.17
        add_beveled_box(f"Chair_StarLeg_{i}", (0.34, 0.034, 0.026), (lx, ly, 0.075), mat_aluminum, col, bevel_w=0.004, rot=(0, math.radians(6), ang), parent=chair)
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.028, depth=0.028, location=(math.cos(ang) * 0.31, math.sin(ang) * 0.31, 0.028))
        wh = bpy.context.active_object
        wh.name = f"Chair_Wheel_{i}"
        wh.rotation_euler = (math.pi / 2, 0, ang)
        wh.data.materials.append(mat_steel)
        link_obj(wh, col)
        wh.parent = chair

    # Seat cushion + Side bolsters
    add_beveled_box("Chair_Seat", (0.50, 0.48, 0.095), (0, 0, 0.46), mat_chair_leather, col, bevel_w=0.018, parent=chair)
    add_beveled_box("Chair_SeatStripe", (0.46, 0.018, 0.022), (0, 0.23, 0.47), mat_chair_accent, col, bevel_w=0.003, parent=chair)
    # 4D Armrests
    for sx in (-0.30, 0.30):
        add_beveled_box(f"Chair_ArmPost_{'L' if sx < 0 else 'R'}", (0.032, 0.045, 0.22), (sx, 0.0, 0.56), mat_steel, col, bevel_w=0.004, parent=chair)
        add_beveled_box(f"Chair_ArmPad_{'L' if sx < 0 else 'R'}", (0.085, 0.24, 0.030), (sx, 0.03, 0.67), mat_chair_leather, col, bevel_w=0.008, parent=chair)
    # Bucket Backrest + Lumbar + Headrest (positive X-rotation tilts top backward toward -Y!)
    add_beveled_box("Chair_Backrest", (0.48, 0.09, 0.78), (0, -0.24, 0.88), mat_chair_leather, col, bevel_w=0.022, rot=(math.radians(10), 0, 0), parent=chair)
    add_beveled_box("Chair_BackAccent", (0.34, 0.02, 0.62), (0, -0.285, 0.88), mat_chair_accent, col, bevel_w=0.005, rot=(math.radians(10), 0, 0), parent=chair)
    add_beveled_box("Chair_Headrest", (0.28, 0.08, 0.14), (0, -0.28, 1.21), mat_chair_leather, col, bevel_w=0.018, rot=(math.radians(6), 0, 0), parent=chair)

    # Pack generated textures inside the GLB
    bpy.ops.file.pack_all()
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
        export_image_format="AUTO",
    )
    size_kb = os.path.getsize(OUT_PATH) / 1024.0
    print(f"Exported {OUT_PATH} ({size_kb:.1f} KB), objects={len(bpy.data.objects)}")


build_workstation()
