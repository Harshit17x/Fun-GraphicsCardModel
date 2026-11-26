"""Blender script (executed via port 9876) to build & export gpu_core_pedestal.glb."""
import math
import os
import bpy
import bmesh

OUT_PATH = "/Users/harshitbisht/Desktop/graphic card/assets/gpu_core_pedestal.glb"


def reset_scene():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    for name in ("GpuCorePedestal",):
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


def add_beveled_box(name, size, loc, mat, col, parent, bevel_w=0.005, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel_w > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel_w, segments=2, affect="EDGES", clamp_overlap=True)
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    link_obj(obj, col)
    obj.parent = parent
    return obj


def build_core_pedestal():
    reset_scene()
    col = ensure_collection("GpuCorePedestal")

    mat_dark = make_pbr_mat("Pedestal_Obsidian", (0.06, 0.07, 0.09), metallic=0.75, roughness=0.32)
    mat_titanium = make_pbr_mat("Pedestal_Titanium", (0.76, 0.71, 0.59), metallic=0.92, roughness=0.22)
    mat_aluminum = make_pbr_mat("Pedestal_Aluminum", (0.70, 0.74, 0.80), metallic=0.88, roughness=0.25)
    mat_copper = make_pbr_mat("Pedestal_CopperCoil", (0.85, 0.45, 0.22), metallic=0.94, roughness=0.22)
    mat_glass = make_pbr_mat("Pedestal_CryoGlass", (0.76, 0.94, 0.98), metallic=0.1, roughness=0.04, alpha=0.22)
    mat_green = make_pbr_mat(
        "Pedestal_NvGlow", (0.46, 0.78, 0.0), metallic=0.0, roughness=0.18,
        emission=(0.46, 0.90, 0.02), emission_strength=4.2
    )
    mat_cyan = make_pbr_mat(
        "Pedestal_CryoCyan", (0.10, 0.82, 0.98), metallic=0.0, roughness=0.18,
        emission=(0.15, 0.86, 1.0), emission_strength=3.6
    )

    root = bpy.data.objects.new("GpuCorePedestal_Root", None)
    link_obj(root, col)

    # 1. Octagonal Stepped Base Plinth (height 0.72m)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.38, depth=0.08, location=(0, 0, 0.04))
    base0 = bpy.context.active_object
    base0.name = "Pedestal_FloorPlinth"
    base0.data.materials.append(mat_dark)
    link_obj(base0, col)
    base0.parent = root

    # Glowing emerald floor ring
    bpy.ops.mesh.primitive_torus_add(major_radius=0.375, minor_radius=0.008, major_segments=32, minor_segments=8, location=(0, 0, 0.012))
    ring0 = bpy.context.active_object
    ring0.name = "Pedestal_FloorRing"
    ring0.data.materials.append(mat_green)
    link_obj(ring0, col)
    ring0.parent = root

    # Main Octagonal Column
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.27, depth=0.64, location=(0, 0, 0.40))
    col_body = bpy.context.active_object
    col_body.name = "Pedestal_Column"
    col_body.data.materials.append(mat_dark)
    link_obj(col_body, col)
    col_body.parent = root

    # Brushed Titanium Lower Collar & Front Display Plate
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.295, depth=0.07, location=(0, 0, 0.72))
    collar = bpy.context.active_object
    collar.name = "Pedestal_UpperCollar"
    collar.data.materials.append(mat_titanium)
    link_obj(collar, col)
    collar.parent = root

    # Vertical glowing indicator ribs on 4 cardinal faces
    for ang_deg in (0, 90, 180, 270):
        rad = math.radians(ang_deg)
        rx = math.sin(rad) * 0.255
        ry = -math.cos(rad) * 0.255
        add_beveled_box(f"Pedestal_Rib_{ang_deg}", (0.025, 0.020, 0.46), (rx, ry, 0.40), mat_cyan if ang_deg % 180 else mat_green, col, root, bevel_w=0.003, rot=(0, 0, rad))

    # 2. Cryogenic Chamber Support Struts & Top Manifold Cap (Z=0.74 to Z=1.52)
    for i in range(4):
        ang = math.radians(45 + i * 90)
        sx = math.cos(ang) * 0.245
        sy = math.sin(ang) * 0.245
        add_beveled_box(f"Pedestal_Strut_{i}", (0.028, 0.028, 0.76), (sx, sy, 1.12), mat_aluminum, col, root, bevel_w=0.004, rot=(0, 0, ang))

    # Top Cryo Cap
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.285, depth=0.09, location=(0, 0, 1.51))
    top_cap = bpy.context.active_object
    top_cap.name = "Pedestal_TopManifold"
    top_cap.data.materials.append(mat_titanium)
    link_obj(top_cap, col)
    top_cap.parent = root

    # Glowing Cryo Halo Rings inside chamber base & cap
    for rz, mat_r, nm in ((0.76, mat_green, "Bottom"), (1.46, mat_cyan, "Top")):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.19, minor_radius=0.008, major_segments=32, minor_segments=8, location=(0, 0, rz))
        r = bpy.context.active_object
        r.name = f"Pedestal_ChamberHalo_{nm}"
        r.data.materials.append(mat_r)
        link_obj(r, col)
        r.parent = root

    # Translucent Borosilicate Cryo Glass Cylinder
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.225, depth=0.70, location=(0, 0, 1.11))
    glass = bpy.context.active_object
    glass.name = "Pedestal_CryoGlass"
    glass.data.materials.append(mat_glass)
    link_obj(glass, col)
    glass.parent = root

    # 3. Spinning Levitating GPU Core Assembly (named for Three.js animation!)
    spinner = bpy.data.objects.new("Pedestal_Core_Spinner", None)
    spinner.location = (0, 0, 1.11)
    link_obj(spinner, col)
    spinner.parent = root

    # Miniature Stylized Vertical RTX 4090 Core inside Cryo Chamber
    add_beveled_box("Core_Shroud", (0.145, 0.052, 0.34), (0, 0, 0), mat_titanium, col, spinner, bevel_w=0.006)
    add_beveled_box("Core_Heatsink", (0.125, 0.056, 0.31), (0, 0, 0), mat_dark, col, spinner, bevel_w=0.003)
    # Copper heat pipes
    for px in (-0.032, 0.032):
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.006, depth=0.32, location=(px, 0, 0))
        hp = bpy.context.active_object
        hp.name = f"Core_Heatpipe_{px:.2f}"
        hp.data.materials.append(mat_copper)
        link_obj(hp, col)
        hp.parent = spinner

    # Axial Fan Ring on front/back of core
    bpy.ops.mesh.primitive_torus_add(major_radius=0.056, minor_radius=0.005, major_segments=24, minor_segments=8, location=(0, -0.028, -0.08), rotation=(math.pi / 2, 0, 0))
    c_fan = bpy.context.active_object
    c_fan.name = "Core_FanRing"
    c_fan.data.materials.append(mat_green)
    link_obj(c_fan, col)
    c_fan.parent = spinner

    # Orbiting Gyro Hologram Rings
    bpy.ops.mesh.primitive_torus_add(major_radius=0.145, minor_radius=0.004, major_segments=32, minor_segments=8, location=(0, 0, 0), rotation=(math.radians(22), math.radians(15), 0))
    g1 = bpy.context.active_object
    g1.name = "Core_HoloRing_1"
    g1.data.materials.append(mat_cyan)
    link_obj(g1, col)
    g1.parent = spinner

    bpy.ops.mesh.primitive_torus_add(major_radius=0.162, minor_radius=0.0035, major_segments=32, minor_segments=8, location=(0, 0, 0), rotation=(math.radians(-24), math.radians(18), 0))
    g2 = bpy.context.active_object
    g2.name = "Core_HoloRing_2"
    g2.data.materials.append(mat_green)
    link_obj(g2, col)
    g2.parent = spinner

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


build_core_pedestal()
