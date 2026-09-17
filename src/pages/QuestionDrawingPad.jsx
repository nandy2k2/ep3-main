import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Grid, MenuItem, Paper, Slider, Stack, TextField, Typography } from "@mui/material";

const shapeCategories = {
  Common: [
    { type: "rectangle", label: "Rectangle" },
    { type: "rounded", label: "Rounded" },
    { type: "circle", label: "Circle" },
    { type: "diamond", label: "Diamond" },
    { type: "triangle", label: "Triangle" },
    { type: "text", label: "Text" }
  ],
  Circuit: [
    { type: "resistor", label: "Resistor" },
    { type: "capacitor", label: "Capacitor" },
    { type: "inductor", label: "Inductor" },
    { type: "battery", label: "Battery" },
    { type: "ground", label: "Ground" },
    { type: "switch", label: "Switch" }
  ],
  Database: [
    { type: "entity", label: "Entity" },
    { type: "database", label: "Database" },
    { type: "process", label: "Process" },
    { type: "decision", label: "Decision" },
    { type: "document", label: "Document" },
    { type: "actor", label: "Actor" }
  ]
};

const circuitShapes = ["resistor", "capacitor", "inductor", "battery", "ground", "switch"];
const minSize = 24;
const toRad = (deg) => (Number(deg || 0) * Math.PI) / 180;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const centerOf = (item) => ({ x: item.x + item.w / 2, y: item.y + item.h / 2 });
const rotatePoint = (point, center, angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
};
const localPoint = (point, item) => {
  const center = centerOf(item);
  const p = rotatePoint(point, center, -toRad(item.rotation));
  return { x: p.x - item.x, y: p.y - item.y };
};
const handlePoints = (item) => {
  const center = centerOf(item);
  const corners = [
    { name: "nw", x: item.x, y: item.y },
    { name: "ne", x: item.x + item.w, y: item.y },
    { name: "se", x: item.x + item.w, y: item.y + item.h },
    { name: "sw", x: item.x, y: item.y + item.h }
  ].map((point) => ({ ...point, ...rotatePoint(point, center, toRad(item.rotation)) }));
  const rotate = rotatePoint({ x: item.x + item.w / 2, y: item.y - 30 }, center, toRad(item.rotation));
  return [...corners, { name: "rotate", ...rotate }];
};

const drawRoundRect = (ctx, x, y, w, h, r = 12) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const shapePath = (ctx, item) => {
  const { w, h } = item;
  ctx.beginPath();
  if (item.type === "circle") ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (item.type === "diamond" || item.type === "decision") {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
  } else if (item.type === "triangle") {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
  } else if (item.type === "rounded" || item.type === "process") drawRoundRect(ctx, 0, 0, w, h, 14);
  else if (item.type === "database") {
    ctx.ellipse(w / 2, 10, w / 2, 10, 0, 0, Math.PI * 2);
    ctx.rect(0, 10, w, Math.max(1, h - 20));
    ctx.ellipse(w / 2, h - 10, w / 2, 10, 0, 0, Math.PI);
  } else if (item.type === "document") {
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h - 12);
    ctx.quadraticCurveTo(w * 0.75, h, w * 0.5, h - 7);
    ctx.quadraticCurveTo(w * 0.25, h - 14, 0, h);
    ctx.closePath();
  } else ctx.rect(0, 0, w, h);
};

const drawCircuitShape = (ctx, item) => {
  const { w, h } = item;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  if (item.type === "resistor") {
    ctx.lineTo(12, h / 2);
    const step = Math.max(7, (w - 24) / 6);
    for (let i = 0; i < 6; i += 1) ctx.lineTo(12 + i * step, i % 2 ? h * 0.25 : h * 0.75);
    ctx.lineTo(w, h / 2);
  } else if (item.type === "capacitor") {
    ctx.lineTo(w * 0.42, h / 2);
    ctx.moveTo(w * 0.42, h * 0.2);
    ctx.lineTo(w * 0.42, h * 0.8);
    ctx.moveTo(w * 0.58, h * 0.2);
    ctx.lineTo(w * 0.58, h * 0.8);
    ctx.moveTo(w * 0.58, h / 2);
    ctx.lineTo(w, h / 2);
  } else if (item.type === "inductor") {
    ctx.lineTo(12, h / 2);
    const step = Math.max(10, (w - 24) / 4);
    for (let i = 0; i < 4; i += 1) ctx.arc(18 + i * step, h / 2, step / 2, Math.PI, 0);
    ctx.lineTo(w, h / 2);
  } else if (item.type === "battery") {
    ctx.lineTo(w * 0.38, h / 2);
    ctx.moveTo(w * 0.38, h * 0.25);
    ctx.lineTo(w * 0.38, h * 0.75);
    ctx.moveTo(w * 0.52, h * 0.35);
    ctx.lineTo(w * 0.52, h * 0.65);
    ctx.moveTo(w * 0.52, h / 2);
    ctx.lineTo(w, h / 2);
  } else if (item.type === "ground") {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h * 0.55);
    ctx.moveTo(w * 0.25, h * 0.55);
    ctx.lineTo(w * 0.75, h * 0.55);
    ctx.moveTo(w * 0.35, h * 0.7);
    ctx.lineTo(w * 0.65, h * 0.7);
    ctx.moveTo(w * 0.45, h * 0.85);
    ctx.lineTo(w * 0.55, h * 0.85);
  } else {
    ctx.lineTo(w * 0.42, h / 2);
    ctx.moveTo(w * 0.42, h / 2);
    ctx.lineTo(w * 0.72, h * 0.25);
    ctx.moveTo(w * 0.72, h / 2);
    ctx.lineTo(w, h / 2);
  }
};

export default function QuestionDrawingPad({ value, onChange, disabled, initialColor = "#111827", initialBrushSize = 2, onStyleChange = () => {} }) {
  const canvasRef = useRef(null);
  const imageInputRef = useRef(null);
  const baseImageRef = useRef(null);
  const imageCacheRef = useRef({});
  const actionRef = useRef(null);
  const internalValueRef = useRef("");
  const loadedInitialRef = useRef(false);
  const draggedShapeRef = useRef("");
  const paletteDragActiveRef = useRef(false);
  const [mode, setMode] = useState("select");
  const [category, setCategory] = useState("Common");
  const [selectedShape, setSelectedShape] = useState("rectangle");
  const [selectedId, setSelectedId] = useState("");
  const [connectorStart, setConnectorStart] = useState("");
  const [elements, setElements] = useState([]);
  const [strokeColor, setStrokeColor] = useState(initialColor || "#111827");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(35);
  const [borderWidth, setBorderWidth] = useState(2);
  const [brushSize, setBrushSize] = useState(Number(initialBrushSize || 2));
  const [textValue, setTextValue] = useState("Label");

  const shapes = useMemo(() => shapeCategories[category] || [], [category]);
  const validShapeTypes = useMemo(() => new Set(Object.values(shapeCategories).flat().map((shape) => shape.type)), []);
  const selectedElement = useMemo(() => elements.find((item) => item.id === selectedId), [elements, selectedId]);

  const canvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: (source.clientX - rect.left) * (canvas.width / rect.width),
      y: (source.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const droppedShapeType = (event) => {
    const customType = event.dataTransfer.getData("application/x-question-shape");
    const plainType = event.dataTransfer.getData("text/plain");
    const type = customType || (paletteDragActiveRef.current ? plainType : "");
    return validShapeTypes.has(type) ? type : "";
  };

  const drawImageFit = (ctx, image, box) => {
    const imageRatio = image.width / image.height;
    const boxRatio = box.w / box.h;
    let width = box.w;
    let height = box.h;
    let x = box.x;
    let y = box.y;
    if (imageRatio > boxRatio) {
      height = width / imageRatio;
      y = box.y + (box.h - height) / 2;
    } else {
      width = height * imageRatio;
      x = box.x + (box.w - width) / 2;
    }
    ctx.drawImage(image, x, y, width, height);
  };

  const drawBaseImage = (ctx, image, canvas) => {
    drawImageFit(ctx, image, { x: 0, y: 0, w: canvas.width, h: canvas.height });
  };

  const getCachedImage = (src) => {
    if (!src) return null;
    if (imageCacheRef.current[src]) return imageCacheRef.current[src];
    const image = new Image();
    image.onload = () => redraw();
    image.src = src;
    imageCacheRef.current[src] = image;
    return image;
  };

  const loadBoardImageFile = (file) => {
    if (!file || !file.type?.startsWith("image/") || disabled) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        const maxWidth = Math.min(320, (canvas?.width || 980) * 0.45);
        const maxHeight = Math.min(220, (canvas?.height || 380) * 0.55);
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const w = Math.max(80, image.width * ratio);
        const h = Math.max(60, image.height * ratio);
        const next = {
          id: `image-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          kind: "image",
          type: "image",
          src: reader.result,
          x: ((canvas?.width || 980) - w) / 2,
          y: ((canvas?.height || 380) - h) / 2,
          w,
          h,
          rotation: 0,
          opacity: 100
        };
        imageCacheRef.current[reader.result] = image;
        setElements((prev) => [...prev, next]);
        setSelectedId(next.id);
        setMode("select");
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const drawImageElement = (ctx, item) => {
    const image = getCachedImage(item.src);
    if (!image?.complete) return;
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
    ctx.rotate(toRad(item.rotation));
    ctx.globalAlpha = Math.max(0, Math.min(100, Number(item.opacity ?? 100))) / 100;
    drawImageFit(ctx, image, { x: -item.w / 2, y: -item.h / 2, w: item.w, h: item.h });
    ctx.restore();
  };

  const drawShape = (ctx, item) => {
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
    ctx.rotate(toRad(item.rotation));
    ctx.translate(-item.w / 2, -item.h / 2);
    ctx.globalAlpha = Math.max(0, Math.min(100, Number(item.opacity ?? opacity))) / 100;
    ctx.fillStyle = item.fillColor || fillColor;
    ctx.strokeStyle = item.strokeColor || strokeColor;
    ctx.lineWidth = Number(item.borderWidth || borderWidth || 1);
    if (circuitShapes.includes(item.type)) {
      ctx.globalAlpha = 1;
      drawCircuitShape(ctx, item);
      ctx.stroke();
    } else if (item.type === "actor") {
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.ellipse(item.w / 2, 12, 12, 12, 0, 0, Math.PI * 2);
      ctx.moveTo(item.w / 2, 24);
      ctx.lineTo(item.w / 2, item.h - 12);
      ctx.moveTo(10, 42);
      ctx.lineTo(item.w - 10, 42);
      ctx.moveTo(item.w / 2, item.h - 12);
      ctx.lineTo(10, item.h);
      ctx.moveTo(item.w / 2, item.h - 12);
      ctx.lineTo(item.w - 10, item.h);
      ctx.stroke();
    } else {
      shapePath(ctx, item);
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (item.label || item.type === "text" || item.type === "entity") {
      ctx.fillStyle = item.strokeColor || strokeColor;
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.label || "Label", item.w / 2, item.h / 2);
    }
    ctx.restore();
  };

  const redraw = (showSelection = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (baseImageRef.current) drawBaseImage(ctx, baseImageRef.current, canvas);
    elements.forEach((item) => {
      if (item.kind === "connector") {
        const from = elements.find((shape) => shape.id === item.from);
        const to = elements.find((shape) => shape.id === item.to);
        if (!from || !to) return;
        const a = centerOf(from);
        const b = centerOf(to);
        ctx.save();
        ctx.strokeStyle = item.strokeColor || strokeColor;
        ctx.lineWidth = Number(item.borderWidth || 2);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - 12 * Math.cos(angle - 0.35), b.y - 12 * Math.sin(angle - 0.35));
        ctx.lineTo(b.x - 12 * Math.cos(angle + 0.35), b.y - 12 * Math.sin(angle + 0.35));
        ctx.closePath();
        ctx.fillStyle = item.strokeColor || strokeColor;
        ctx.fill();
        ctx.restore();
      } else if (item.kind === "stroke") {
        ctx.save();
        ctx.strokeStyle = item.strokeColor || strokeColor;
        ctx.lineWidth = Number(item.brushSize || brushSize);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        (item.points || []).forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
        ctx.stroke();
        ctx.restore();
      } else if (item.kind === "image") {
        drawImageElement(ctx, item);
      } else {
        drawShape(ctx, item);
      }
    });
    if (showSelection && (selectedElement?.kind === "shape" || selectedElement?.kind === "image")) {
      const center = centerOf(selectedElement);
      const points = handlePoints(selectedElement);
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(toRad(selectedElement.rotation));
      ctx.translate(-center.x, -center.y);
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 1;
      ctx.strokeRect(selectedElement.x - 4, selectedElement.y - 4, selectedElement.w + 8, selectedElement.h + 8);
      ctx.restore();
      points.forEach((point) => {
        ctx.save();
        ctx.fillStyle = point.name === "rotate" ? "#f59e0b" : "#ffffff";
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.name === "rotate" ? 6 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
    }
  };

  const emit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    redraw(false);
    const next = canvas.toDataURL("image/png");
    internalValueRef.current = next;
    onChange(next);
    redraw(true);
  };

  useEffect(() => {
    if (value && value === internalValueRef.current) return;
    if (loadedInitialRef.current && elements.length) return;
    if (!value) {
      baseImageRef.current = null;
      redraw();
      return;
    }
    const image = new Image();
    image.onload = () => {
      baseImageRef.current = image;
      loadedInitialRef.current = true;
      redraw();
    };
    image.src = value;
  }, [value]);

  useEffect(() => {
    redraw();
  }, [selectedId]);

  useEffect(() => {
    redraw();
    const timer = setTimeout(emit, 0);
    return () => clearTimeout(timer);
  }, [elements]);

  useEffect(() => {
    onStyleChange({ color: strokeColor, brushsize: brushSize });
  }, [strokeColor, brushSize]);

  const hitHandle = (point) => {
    if (!selectedElement || !["shape", "image"].includes(selectedElement.kind)) return null;
    return handlePoints(selectedElement).find((handle) => distance(point, handle) <= 9) || null;
  };

  const hitShape = (point) => [...elements].reverse().find((item) => {
    if (!["shape", "image"].includes(item.kind)) return false;
    const p = localPoint(point, item);
    return p.x >= 0 && p.x <= item.w && p.y >= 0 && p.y <= item.h;
  });

  const addShapeAt = (point, type = selectedShape) => {
    const shapeType = validShapeTypes.has(type) ? type : selectedShape;
    const next = {
      id: `shape-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind: "shape",
      type: shapeType,
      label: shapeType === "text" || shapeType === "entity" ? textValue : "",
      x: point.x - 55,
      y: point.y - 30,
      w: shapeType === "actor" || shapeType === "ground" ? 70 : 110,
      h: circuitShapes.includes(shapeType) ? 50 : 60,
      fillColor,
      strokeColor,
      opacity,
      borderWidth,
      rotation: 0
    };
    setElements((prev) => [...prev, next]);
    setSelectedId(next.id);
    setMode("select");
  };

  const resizeShape = (item, handle, point) => {
    const p = localPoint(point, item);
    let x = item.x;
    let y = item.y;
    let w = item.w;
    let h = item.h;
    if (handle.includes("e")) w = Math.max(minSize, p.x);
    if (handle.includes("s")) h = Math.max(minSize, p.y);
    if (handle.includes("w")) {
      const right = item.x + item.w;
      x = item.x + Math.min(p.x, item.w - minSize);
      w = Math.max(minSize, right - x);
    }
    if (handle.includes("n")) {
      const bottom = item.y + item.h;
      y = item.y + Math.min(p.y, item.h - minSize);
      h = Math.max(minSize, bottom - y);
    }
    return { ...item, x, y, w, h };
  };

  const pointerDown = (event) => {
    if (disabled) return;
    event.preventDefault();
    const point = canvasPoint(event);
    const handle = hitHandle(point);
    if (handle && selectedElement) {
      actionRef.current = { type: handle.name === "rotate" ? "rotate" : "resize", handle: handle.name, id: selectedElement.id, original: selectedElement };
      return;
    }
    const hit = hitShape(point);
    if (mode === "shape") {
      addShapeAt(point);
      return;
    }
    if (mode === "connect") {
      if (!hit) return;
      if (!connectorStart) {
        setConnectorStart(hit.id);
        setSelectedId(hit.id);
      } else if (connectorStart !== hit.id) {
        setElements((prev) => [...prev, { id: `connector-${Date.now()}`, kind: "connector", from: connectorStart, to: hit.id, strokeColor, borderWidth }]);
        setConnectorStart("");
        setMode("select");
      }
      return;
    }
    if (hit) {
      setSelectedId(hit.id);
      actionRef.current = { type: "move", id: hit.id, dx: point.x - hit.x, dy: point.y - hit.y };
      return;
    }
    setSelectedId("");
    if (mode === "draw") {
      const stroke = { id: `stroke-${Date.now()}`, kind: "stroke", points: [point], strokeColor, brushSize };
      setElements((prev) => [...prev, stroke]);
      actionRef.current = { type: "draw", id: stroke.id };
    }
  };

  const pointerMove = (event) => {
    if (disabled || !actionRef.current) return;
    event.preventDefault();
    const point = canvasPoint(event);
    const action = actionRef.current;
    setElements((prev) => prev.map((item) => {
      if (item.id !== action.id) return item;
      if (action.type === "draw") return { ...item, points: [...(item.points || []), point] };
      if (action.type === "move") return { ...item, x: point.x - action.dx, y: point.y - action.dy };
      if (action.type === "resize") return resizeShape(action.original, action.handle, point);
      if (action.type === "rotate") {
        const center = centerOf(action.original);
        const angle = Math.atan2(point.y - center.y, point.x - center.x) + Math.PI / 2;
        return { ...item, rotation: Math.round((angle * 180) / Math.PI) };
      }
      return item;
    }));
  };

  const pointerUp = () => {
    if (actionRef.current) {
      actionRef.current = null;
      emit();
    }
  };

  const updateSelectedStyle = () => {
    if (!selectedId) return;
    setElements((prev) => prev.map((item) => {
      if (item.id !== selectedId) return item;
      if (item.kind === "image") return { ...item, opacity };
      return { ...item, fillColor, strokeColor, opacity, borderWidth, label: item.type === "text" || item.type === "entity" ? textValue : item.label };
    }));
  };
  const rotateSelected = (delta) => {
    if (!selectedId) return;
    setElements((prev) => prev.map((item) => item.id === selectedId ? { ...item, rotation: Number(item.rotation || 0) + delta } : item));
  };
  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((item) => item.id !== selectedId && item.from !== selectedId && item.to !== selectedId));
    setSelectedId("");
  };
  const clearAll = () => {
    baseImageRef.current = null;
    loadedInitialRef.current = false;
    setElements([]);
    setSelectedId("");
    internalValueRef.current = "";
    onChange("");
  };

  return (
    <Box>
      <Grid container spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Mode" value={mode} disabled={disabled} onChange={(e) => setMode(e.target.value)}><MenuItem value="select">Select / move</MenuItem><MenuItem value="draw">Free draw</MenuItem><MenuItem value="shape">Add shapes</MenuItem><MenuItem value="connect">Connectors</MenuItem></TextField></Grid>
        <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Category" value={category} disabled={disabled} onChange={(e) => { setCategory(e.target.value); setSelectedShape((shapeCategories[e.target.value] || [])[0]?.type || "rectangle"); }}>{Object.keys(shapeCategories).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Shape" value={selectedShape} disabled={disabled} onChange={(e) => setSelectedShape(e.target.value)}>{shapes.map((shape) => <MenuItem key={shape.type} value={shape.type}>{shape.label}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Fill" type="color" value={fillColor} disabled={disabled} onChange={(e) => setFillColor(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Border" type="color" value={strokeColor} disabled={disabled} onChange={(e) => setStrokeColor(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Text" value={textValue} disabled={disabled} onChange={(e) => setTextValue(e.target.value)} /></Grid>
        <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Transparency</Typography><Slider min={5} max={100} value={opacity} disabled={disabled} onChange={(_, value) => setOpacity(value)} valueLabelDisplay="auto" /></Grid>
        <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Border width</Typography><Slider min={1} max={12} value={borderWidth} disabled={disabled} onChange={(_, value) => setBorderWidth(value)} valueLabelDisplay="auto" /></Grid>
        <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Brush size</Typography><Slider min={1} max={18} value={brushSize} disabled={disabled} onChange={(_, value) => setBrushSize(value)} valueLabelDisplay="auto" /></Grid>
        <Grid item xs={12} md={3}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" disabled={disabled || !selectedId} onClick={updateSelectedStyle}>Apply</Button>
            <Button size="small" variant="outlined" disabled={disabled || !selectedId} onClick={() => rotateSelected(-15)}>Rotate -15</Button>
            <Button size="small" variant="outlined" disabled={disabled || !selectedId} onClick={() => rotateSelected(15)}>Rotate +15</Button>
            <Button size="small" color="error" variant="outlined" disabled={disabled || !selectedId} onClick={deleteSelected}>Delete</Button>
          </Stack>
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
        {shapes.map((shape) => (
          <Box
            key={shape.type}
            draggable={!disabled}
            onMouseDown={() => {
              if (disabled) return;
              setMode("shape");
              setSelectedShape(shape.type);
            }}
            onClick={() => { setMode("shape"); setSelectedShape(shape.type); }}
            onDragStart={(event) => {
              if (disabled) {
                event.preventDefault();
                return;
              }
              draggedShapeRef.current = shape.type;
              paletteDragActiveRef.current = true;
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData("text/plain", shape.type);
              event.dataTransfer.setData("application/x-question-shape", shape.type);
            }}
            onDragEnd={() => {
              draggedShapeRef.current = "";
              paletteDragActiveRef.current = false;
            }}
            sx={{ display: "inline-flex", mb: 0.5, cursor: disabled ? "not-allowed" : "grab" }}
          >
            <Chip
              label={shape.label}
              color={selectedShape === shape.type ? "primary" : "default"}
              sx={{ cursor: "inherit", userSelect: "none" }}
            />
          </Box>
        ))}
        {connectorStart && <Chip color="info" label="Select another shape to connect" />}
        {selectedElement && <Chip color="success" label={`Selected: ${selectedElement.type || "item"}`} />}
      </Stack>
      <Paper
        variant="outlined"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (disabled) return;
          const imageFile = Array.from(event.dataTransfer.files || []).find((file) => file.type?.startsWith("image/"));
          if (imageFile) {
            loadBoardImageFile(imageFile);
            draggedShapeRef.current = "";
            paletteDragActiveRef.current = false;
            return;
          }
          const type = droppedShapeType(event) || draggedShapeRef.current;
          draggedShapeRef.current = "";
          paletteDragActiveRef.current = false;
          if (!validShapeTypes.has(type)) return;
          addShapeAt(canvasPoint(event), type);
        }}
        sx={{ p: 1, bgcolor: "#fff" }}
      >
        <Box
          component="canvas"
          ref={canvasRef}
          draggable={false}
          width={980}
          height={380}
          onMouseDown={pointerDown}
          onMouseMove={pointerMove}
          onMouseUp={pointerUp}
          onMouseLeave={pointerUp}
          onTouchStart={pointerDown}
          onTouchMove={pointerMove}
          onTouchEnd={pointerUp}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (disabled) return;
            const imageFile = Array.from(event.dataTransfer.files || []).find((file) => file.type?.startsWith("image/"));
            if (imageFile) {
              loadBoardImageFile(imageFile);
              draggedShapeRef.current = "";
              paletteDragActiveRef.current = false;
              return;
            }
            const type = droppedShapeType(event) || draggedShapeRef.current;
            draggedShapeRef.current = "";
            paletteDragActiveRef.current = false;
            if (!validShapeTypes.has(type)) return;
            addShapeAt(canvasPoint(event), type);
          }}
          sx={{ width: "100%", height: 380, bgcolor: "#fff", border: "1px solid #cbd5e1", borderRadius: 1, touchAction: "none", cursor: disabled ? "not-allowed" : mode === "shape" ? "copy" : mode === "connect" ? "crosshair" : mode === "select" ? "move" : "crosshair" }}
        />
      </Paper>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            loadBoardImageFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => imageInputRef.current?.click()}>Add Image</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={emit}>Save Drawing</Button>
        <Button size="small" color="error" variant="outlined" disabled={disabled} onClick={clearAll}>Clear All</Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">Add or drop an image, then draw over it. Select a shape to move it, drag corner handles to resize, drag the orange handle to rotate, or use connector mode to join shapes.</Typography>
    </Box>
  );
}
