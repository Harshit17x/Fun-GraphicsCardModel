"""Blender script (executed via port 9876) to build & export articulated player_model.glb."""
import math
import os
import bpy
import bmesh

OUT_PATH = "/Users/harshitbisht/Desktop/graphic card/assets/player_model.glb"


def reset_scene():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    for name in ("PlayerAvatar",):
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


def make_pbr_mat(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
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


def add_part_box(name, size, local_loc, mat, col, parent, bevel_w=0.012, rot=(0, 0, 0), segs=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel_w > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel_w, segments=segs, affect="EDGES", clamp_overlap=True)
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = local_loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    link_obj(obj, col)
    obj.parent = parent
    return obj


def add_part_capsule(name, radius, depth, local_loc, mat, col, parent, rot=(0, 0, 0), segs=18):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segs, radius=radius, depth=depth, location=local_loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    link_obj(obj, col)
    obj.parent = parent
    return obj


def build_player():
    reset_scene()
    col = ensure_collection("PlayerAvatar")

    # Stylized Cyber-Engineer / Pro Lab Operator Palette
    mat_skin = make_pbr_mat("PL_Skin", (0.76, 0.56, 0.44), metallic=0.0, roughness=0.58)
    mat_hair = make_pbr_mat("PL_Hair", (0.04, 0.045, 0.055), metallic=0.1, roughness=0.65)
    mat_jacket = make_pbr_mat("PL_TechJacket", (0.09, 0.105, 0.13), metallic=0.18, roughness=0.52)
    mat_vest = make_pbr_mat("PL_ArmorVest", (0.16, 0.19, 0.24), metallic=0.55, roughness=0.34)
    mat_pants = make_pbr_mat("PL_TacticalPants", (0.06, 0.07, 0.09), metallic=0.05, roughness=0.68)
    mat_boots = make_pbr_mat("PL_CyberBoots", (0.12, 0.135, 0.16), metallic=0.25, roughness=0.42)
    mat_visor = make_pbr_mat(
        "PL_CyberVisor", (0.08, 0.85, 0.96), metallic=0.2, roughness=0.08,
        emission=(0.15, 0.88, 1.0), emission_strength=2.8, alpha=0.82
    )
    mat_nv_glow = make_pbr_mat(
        "PL_NvidiaCircuit", (0.46, 0.76, 0.0), metallic=0.1, roughness=0.2,
        emission=(0.46, 0.88, 0.02), emission_strength=3.5
    )
    mat_metal = make_pbr_mat("PL_TitaniumTrim", (0.72, 0.75, 0.80), metallic=0.85, roughness=0.25)

    # Root at feet center (Z=0, facing +Y -> wait: -Y in Blender faces +Z in Three.js!)
    root = bpy.data.objects.new("Player_Root", None)
    link_obj(root, col)

    # Pelvis pivot (0.92m above floor)
    pelvis = bpy.data.objects.new("Player_Pelvis", None)
    pelvis.location = (0, 0, 0.92)
    link_obj(pelvis, col)
    pelvis.parent = root

    add_part_box("PL_Belt", (0.34, 0.21, 0.09), (0, 0, 0.02), mat_vest, col, pelvis, bevel_w=0.015)
    add_part_box("PL_BeltBuckle", (0.08, 0.02, 0.05), (0, -0.11, 0.02), mat_nv_glow, col, pelvis, bevel_w=0.004)

    # Torso pivot
    torso = bpy.data.objects.new("Player_Torso", None)
    torso.location = (0, 0, 0.06)
    link_obj(torso, col)
    torso.parent = pelvis

    # Athletic tapered torso & tech jacket
    add_part_box("PL_WaistJacket", (0.31, 0.19, 0.20), (0, 0, 0.11), mat_jacket, col, torso, bevel_w=0.042, segs=4)
    add_part_box("PL_ChestJacket", (0.37, 0.22, 0.28), (0, 0, 0.31), mat_jacket, col, torso, bevel_w=0.055, segs=4)
    add_part_box("PL_ChestArmorFront", (0.29, 0.045, 0.24), (0, -0.10, 0.30), mat_vest, col, torso, bevel_w=0.018, segs=3)
    add_part_box("PL_SpinePack", (0.18, 0.06, 0.30), (0, 0.11, 0.29), mat_vest, col, torso, bevel_w=0.024, segs=3)
    # Glowing NVIDIA spine & shoulder circuit energy channels
    add_part_box("PL_SpineGlow", (0.022, 0.016, 0.24), (0, 0.142, 0.29), mat_nv_glow, col, torso, bevel_w=0.004)
    add_part_box("PL_ChestBadge", (0.055, 0.02, 0.032), (-0.075, -0.122, 0.35), mat_nv_glow, col, torso, bevel_w=0.003)
    # High tech collar
    add_part_box("PL_Collar", (0.19, 0.17, 0.075), (0, 0.012, 0.46), mat_jacket, col, torso, bevel_w=0.022, segs=3)

    # Neck & Head Pivot (at Z=1.48m total -> 0.50m above torso)
    head_pivot = bpy.data.objects.new("Player_Head", None)
    head_pivot.location = (0, 0, 0.50)
    link_obj(head_pivot, col)
    head_pivot.parent = torso

    add_part_capsule("PL_Neck", 0.052, 0.09, (0, 0, 0.03), mat_skin, col, head_pivot)
    # Sculpted head
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.115, location=(0, -0.01, 0.16))
    head = bpy.context.active_object
    head.name = "PL_HeadMesh"
    head.scale = (0.86, 0.98, 1.08)
    head.data.materials.append(mat_skin)
    link_obj(head, col)
    head.parent = head_pivot

    # Modern sculpted swept hair crown
    add_part_box("PL_HairTop", (0.195, 0.22, 0.10), (0, 0.005, 0.235), mat_hair, col, head_pivot, bevel_w=0.036, rot=(math.radians(-12), 0, 0))
    add_part_box("PL_HairBack", (0.18, 0.08, 0.14), (0, 0.085, 0.175), mat_hair, col, head_pivot, bevel_w=0.024)

    # AR Cyber-Visor Glasses (facing -Y)
    add_part_box("PL_VisorLens", (0.19, 0.055, 0.052), (0, -0.102, 0.175), mat_visor, col, head_pivot, bevel_w=0.012)
    add_part_box("PL_VisorFrame", (0.205, 0.11, 0.016), (0, -0.04, 0.185), mat_metal, col, head_pivot, bevel_w=0.004)

    # Studio Comms Headset
    for sx in (-0.11, 0.11):
        add_part_capsule(f"PL_EarCup_{'L' if sx < 0 else 'R'}", 0.042, 0.032, (sx, 0.0, 0.165), mat_vest, col, head_pivot, rot=(0, math.pi / 2, 0))
        add_part_capsule(f"PL_EarGlow_{'L' if sx < 0 else 'R'}", 0.026, 0.035, (sx * 1.04, 0.0, 0.165), mat_nv_glow, col, head_pivot, rot=(0, math.pi / 2, 0))
    add_part_box("PL_Headband", (0.225, 0.032, 0.022), (0, 0.0, 0.275), mat_vest, col, head_pivot, bevel_w=0.006)
    add_part_box("PL_MicBoom", (0.010, 0.10, 0.010), (-0.105, -0.06, 0.125), mat_metal, col, head_pivot, bevel_w=0.002, rot=(math.radians(15), 0, math.radians(-15)))

    # Articulated Arms (pivots at shoulders!)
    for side, sx in (("L", -0.24), ("R", 0.24)):
        arm_pivot = bpy.data.objects.new(f"Player_Arm_{side}", None)
        arm_pivot.location = (sx, 0, 0.41)
        link_obj(arm_pivot, col)
        arm_pivot.parent = torso

        # Shoulder pauldron
        add_part_box(f"PL_Pauldron_{side}", (0.115, 0.135, 0.10), (0, 0, -0.02), mat_vest, col, arm_pivot, bevel_w=0.022)
        # Upper arm
        add_part_capsule(f"PL_UpperArm_{side}", 0.048, 0.25, (0, 0, -0.15), mat_jacket, col, arm_pivot)
        # Forearm & cyber wrist-bracer
        add_part_capsule(f"PL_Forearm_{side}", 0.042, 0.24, (0, -0.02, -0.37), mat_jacket, col, arm_pivot, rot=(math.radians(8), 0, 0))
        add_part_box(f"PL_WristGlow_{side}", (0.07, 0.075, 0.035), (0, -0.03, -0.44), mat_nv_glow, col, arm_pivot, bevel_w=0.006)
        # Gloved hand
        add_part_box(f"PL_Hand_{side}", (0.048, 0.065, 0.085), (0, -0.04, -0.52), mat_boots, col, arm_pivot, bevel_w=0.012)

    # Articulated Legs (pivots at hips!)
    for side, sx in (("L", -0.105), ("R", 0.105)):
        leg_pivot = bpy.data.objects.new(f"Player_Leg_{side}", None)
        leg_pivot.location = (sx, 0, -0.02)
        link_obj(leg_pivot, col)
        leg_pivot.parent = pelvis

        # Thigh
        add_part_capsule(f"PL_Thigh_{side}", 0.072, 0.42, (0, 0, -0.22), mat_pants, col, leg_pivot)
        # Knee pad
        add_part_box(f"PL_KneePad_{side}", (0.11, 0.05, 0.10), (0, -0.055, -0.42), mat_vest, col, leg_pivot, bevel_w=0.014)
        # Shin
        add_part_capsule(f"PL_Shin_{side}", 0.056, 0.40, (0, 0, -0.62), mat_pants, col, leg_pivot)
        # Cyber high-top boot + glowing emerald sole accent
        add_part_box(f"PL_Boot_{side}", (0.115, 0.23, 0.10), (0, -0.04, -0.85), mat_boots, col, leg_pivot, bevel_w=0.020)
        add_part_box(f"PL_BootSole_{side}", (0.120, 0.235, 0.022), (0, -0.04, -0.89), mat_nv_glow, col, leg_pivot, bevel_w=0.005)

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


build_player()
