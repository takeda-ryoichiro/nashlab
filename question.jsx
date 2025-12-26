

/* ================= PATTERNS（回答は range 文字列で定義） ================= */
export const PATTERNS = [
  {
    id: "btn-open ante",
    label: "BTN Open（Unopened）",
    questionBuilder: (hand) => ({
      hand,
      pos: "BTN",
      eff: 40,
      facing: "Unopened",
      stacks: { UTG: 40, MP: 40, CO: 40, BTN: 40, SB: 40, BB: 40 },
      options: ["Fold", "Open 2.2x"],
    }),
    bands: [
      {
        action: "open",
        min: 0.05,
        range: `
              66+, 55:0.998, 44:0.686, A5s+, A4s:0.996, A3s:0.994, A2s:0.997, AKo, AQo:0.992, AJo-A7o,
              A6o:0.809, A5o:0.999, A4o:0.012, K6s+, K5s:0.999, K4s, K3s:0.489, K2s:0.004,
              KTo+, K9o:0.499, Q8s+, Q7s:0.999, Q6s:0.995, Q5s:0.990, Q3s:0.001, QTo+, Q9o:0.493,
              J8s+, J7s:0.999, J6s:0.001, JTo, J9o:0.054, T9s, T8s:0.999, T7s:0.972, T9o:0.351,
              98s, 97s:0.989, 87s:0.999, 76s:0.314, 65s:0.006, 54s:0.001
        `.replace(/\n/g, " "),
      },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })

  },
  {
    id: "sb-vs-btn ante",
    label: "SB vs BTN 2x",
    questionBuilder: (hand) => ({
      hand,
      pos: "SB",
      eff: 25,
      facing: "BTN open 2x",
      stacks: { UTG: 25, MP: 25, CO: 25, BTN: 25, SB: 25, BB: 25 },
      options: ["Fold", "Call", "3bet 7bb", "Jam 25bb"],
    }),
    bands: [
          { action: "JAM", min: 0.05, range: `JJ:0.598, TT:0.760, 99:0.883, 88:0.314, 77:0.024, 66:0.131, 55:0.081, 44:0.677, 33:0.688, 22:0.630, AQs:0.390, ATs:0.001, A8s:0.758, A6s:0.071, A5s:0.588, A4s:0.432, A3s:0.608, A2s:0.546, AKo:0.801, AQo:0.989, AJo:0.375, ATo:0.017, KQs:0.750, KJs:0.608, KTs:0.865, K9s:0.011, K8s:0.006, K7s:0.032, K6s:0.028, K4s:0.040, KQo:0.444, KJo:0.913, KTo:0.489, QJs:0.698, QTs:0.928, Q9s:0.221, Q8s:0.069, QJo:0.254, QTo:0.006, JTs:0.354, J8s:0.004, JTo:0.043, T9s:0.053, 76s:0.001` },
          { action: "3bet", min: 0.05, range: `QQ+, JJ:0.198, TT:0.233, 99:0.028, 88:0.254, 77:0.258, 66:0.220, 55:0.437, 44:0.098, 33:0.021, AKs, AQs:0.389, AJs:0.806, ATs:0.122, A8s:0.048, A7s:0.559, A6s:0.903, A5s:0.409, A4s:0.439, A3s:0.364, A2s:0.416, AKo:0.199, AQo:0.011, AJo:0.446, ATo:0.769, A9o:0.104, A8o:0.006, A6o:0.002, A5o:0.120, A4o:0.001, A3o:0.001, KQs:0.032, KJs:0.013, KTs:0.004, K9s:0.218, K8s:0.255, K7s:0.559, K6s:0.667, K5s:0.760, K4s:0.005, K3s:0.079, K2s:0.001, KQo:0.538, KJo:0.054, KTo:0.335, QJs:0.076, Q9s:0.398, Q8s:0.263, Q7s:0.026, Q6s:0.003, Q5s:0.081, Q4s:0.007, QJo:0.359, QTo:0.027, JTs:0.096, J9s:0.379, J8s:0.057, J7s:0.008, J6s:0.012, J5s:0.002, JTo:0.107, T9s:0.789, T8s:0.081, T7s:0.064, T6s:0.003, 98s:0.604, 87s:0.229, 76s:0.043, 54s:0.015` },
          { action: "call", min: 0.05, range: `JJ:0.204, TT:0.008, 99:0.088, 88:0.432, 77:0.719, 66:0.650, 55:0.482, 44:0.221, 33:0.101, 22:0.006, AQs:0.221, AJs:0.194, ATs:0.877, A9s, A8s:0.194, A7s:0.441, A6s:0.025, A5s:0.003, A4s:0.130, A3s:0.027, A2s:0.037, AJo:0.179, ATo:0.215, A9o:0.128, KQs:0.219, KJs:0.379, KTs:0.131, K9s:0.770, K8s:0.647, K7s:0.064, K6s:0.008, K5s:0.001, KQo:0.018, KJo:0.033, KTo:0.072, QJs:0.227, QTs:0.071, Q9s:0.380, Q8s:0.319, Q7s:0.002, QJo:0.270, QTo:0.012, JTs:0.550, J9s:0.614, J8s:0.009, J7s:0.001, JTo:0.021, T9s:0.155, T8s:0.001, 98s:0.121, 97s:0.001, 87s:0.010, 86s:0.001, 76s:0.001, 64s:0.002, 54s:0.009` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.001)})
  },
  {
    id: "btn open2 ante",
    label: "BTN Open（Unopened）",
    questionBuilder: (hand) => ({
      hand,
      pos: "BTN",
      eff: 15,
      facing: "Unopened",
      stacks: { UTG: 15, MP: 15, CO: 15, BTN: 15, SB: 15, BB: 15 },
      options: ["Fold","open 2bb", "Jam 15bb"],
    }),
    bands: [
          { action: "Jam", min: 0.05, range: `QTs, JTs, KTs, A2s-A8s, QT-KT, A5o-AJo, KQo, 22-88, 99: 0.003, 67s: 0.3, 78s: 0.55` },
          { action: "open", min: 0.05, range: `AQo+, TT+, 99: 0.997, A2o-A5o, KJs+, KJo+, QJs, 54s: 0.50, A9s+, K6s-K9s, Q9s` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "75bb eff UTG open chase",
    label: "UTG 75bb eff Open（クラブマッチ）",
    questionBuilder: (hand) => ({
      hand,
      pos: "UTG",
      eff: 75,
      facing: "Unopened",
      stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
      options: ["Fold","open 2.3bb"],
    }),
    bands: [
          { action: "open", min: 0.05, range: `TT+, 99:0.999, 88-77, 66:0.994, 55:0.957, 44:0.045, ATs+, A9s:0.999, A8s, A7s:0.999, A6s-A5s, A4s:0.993, A3s:0.995, A2s:0.994, ATo+, A9o:0.992, A8o:0.459, A7o:0.006, A6o:0.003, A5o:0.350, A4o:0.002, KQs, KJs:0.999, KTs:0.998, K9s:0.985, K8s:0.996, K7s:0.893, K6s:0.992, K5s:0.880, K4s:0.468, K2s:0.003, KQo, KJo:0.975, KTo:0.718, QJs:0.994, QTs:0.997, Q9s:0.926, Q8s:0.074, Q6s:0.001, QJo:0.713, QTo:0.011, JTs:0.995, J9s:0.928, J8s:0.105, T9s:0.976, T8s:0.761, 98s:0.327, 97s:0.036, 76s:0.374, 65s:0.118, 54s:0.007` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "75bb eff HJ open chase",
    label: "HJ 75bb eff Open（クラブマッチ）",
    questionBuilder: (hand) => ({
      hand,
      pos: "HJ",
      eff: 75,
      facing: "Unopened",
      stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
      options: ["Fold","open 2.3bb"],
    }),
    bands: [
          { action: "open", min: 0.05, range: `TT+, 99:0.999, 88-77, 66:0.996, 55:0.992, 44:0.691, ATs+, A9s:0.999, A8s:0.999, A7s:0.997, A6s-A5s, A4s:0.999, A3s, A2s:0.999, ATo+, A9o:0.999, A8o:0.988, A7o:0.436, A6o:0.008, A5o:0.885, A4o:0.029, A3o:0.001, A2o:0.001, KQs, KJs:0.999, KTs, K9s:0.997, K8s:0.996, K7s:0.995, K6s:0.984, K5s:0.996, K4s:0.923, K3s:0.134, K2s:0.008, KTo+, QJs:0.999, QTs:0.998, Q9s:0.982, Q8s:0.893, Q7s:0.083, Q6s:0.100, Q5s:0.020, QJo:0.993, QTo:0.445, JTs:0.998, J9s:0.986, J8s:0.779, J7s:0.001, JTo:0.643, T9s:0.991, T8s:0.955, T7s:0.711, 98s:0.935, 97s:0.771, 87s:0.373, 76s:0.801, 75s:0.022, 65s:0.353, 54s:0.002` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "75bb eff CO open chase",
    label: "CO 75bb eff Open（クラブマッチ）",
    questionBuilder: (hand) => ({
      hand,
      pos: "CO",
      eff: 75,
      facing: "Unopened",
      stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
      options: ["Fold","open 2.3bb"],
    }),
    bands: [
          { action: "open", min: 0.05, range: `77+, 66:0.999, 55:0.999, 44:0.999, 33:0.639, A2s+, A7o+, A6o:0.843, A5o, A4o:0.853, A3o:0.011, A2o:0.001, KTs+, K9s:0.999, K8s:0.999, K7s:0.999, K6s:0.995, K5s:0.997, K4s:0.996, K3s:0.984, K2s:0.934, KTo+, K9o:0.986, K8o:0.081, K7o:0.001, K6o:0.001, QTs+, Q9s:0.999, Q8s:0.998, Q7s:0.972, Q6s:0.985, Q5s:0.818, Q4s:0.370, Q3s:0.001, QTo+, Q9o:0.022, JTs:0.998, J9s:0.999, J8s:0.987, J7s:0.969, J6s:0.004, J5s:0.011, JTo:0.998, T9s, T8s:0.991, T7s:0.964, T6s:0.089, T9o:0.428, T8o:0.001, 98s:0.986, 97s:0.876, 96s:0.167, 87s:0.993, 86s:0.812, 85s:0.017, 76s:0.980, 75s:0.737, 65s:0.902, 54s:0.876` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "75bb eff BTN open chase",
    label: "BTN 75bb eff Open（クラブマッチ）",
    questionBuilder: (hand) => ({
      hand,
      pos: "BTN",
      eff: 75,
      facing: "Unopened",
      stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
      options: ["Fold","open 2.3bb"],
    }),
    bands: [
          { action: "open", min: 0.05, range: `22+, A2s+, A2o+, K7s+, K6s:0.999, K5s-K3s, K2s:0.998, K9o+, K8o:0.999, K7o-K6o, K5o:0.996, K4o:0.239, K3o:0.002, QJs:0.999, QTs, Q9s:0.999, Q8s:0.999, Q7s, Q6s:0.999, Q5s:0.997, Q4s:0.992, Q3s, Q2s:0.997, Q9o+, Q8o:0.987, Q7o:0.485, Q6o:0.003, JTs, J9s:0.999, J8s, J7s:0.999, J6s:0.997, J5s:0.999, J4s:0.996, J3s:0.998, J2s:0.927, J9o+, J8o:0.966, J7o:0.001, T9s, T8s:0.999, T7s:0.999, T6s:0.996, T5s:0.963, T4s:0.957, T3s:0.268, T2s:0.002, T9o, T8o:0.996, T7o:0.578, 98s:0.999, 97s:0.999, 96s, 95s:0.971, 94s:0.082, 98o:0.955, 97o:0.100, 87s:0.994, 86s:0.995, 85s:0.967, 84s:0.248, 82s:0.001, 87o:0.385, 86o:0.001, 76s:0.998, 75s:0.969, 74s:0.974, 73s:0.001, 76o:0.787, 65s, 64s:0.986, 63s:0.068, 65o:0.003, 54s:0.999, 53s:0.959, 43s:0.774, 42s:0.001` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "75bb eff BTN-vsUTG chase",
    label: "BTN 75bb eff BTN-vsUTG（クラブマッチ））",
    questionBuilder: (hand) => ({
      hand,
      pos: "BTN",
      eff: 75,
      facing: "UTG open 2.3x",
      stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
      options: ["Fold","call", "3bet 6bb", "3bet 10bb"],
    }),
    bands: [
          { action: "3bet 10bb", min: 0.05, range: `KK:0.415, QQ:0.999, JJ:0.926, TT:0.821, 99:0.984, 88:0.911, 77:0.938, 66:0.647, 55:0.781, 44:0.164, 33:0.051, AKs:0.359, AQs:0.991, AJs:0.846, ATs:0.998, A9s:0.940, A8s:0.810, A7s:0.369, A6s:0.211, A5s:0.554, A4s:0.004, A3s:0.016, A2s:0.429, AKo:0.207, AQo:0.402, AJo:0.897, ATo:0.276, KQs:0.992, KJs:0.969, KTs:0.996, K9s:0.742, K8s:0.257, K7s:0.026, K6s:0.042, KQo:0.737, KJo:0.028, QJs:0.850, QTs:0.979, JTs:0.870, J9s:0.001, J8s:0.002, T9s:0.887, T8s:0.001, T7s:0.033, 98s:0.005, 87s:0.161, 86s:0.001, 85s:0.002, 76s:0.414, 65s:0.810, 54s:0.137` },
          { action: "3bet 6bb", min: 0.05, range: `AA:0.181, KK:0.284, JJ:0.074, TT:0.178, 99:0.015, 88:0.080, 77:0.049, 66:0.076, 55:0.037, 44:0.053, AKs:0.336, AQs:0.006, AJs:0.154, ATs:0.001, A9s:0.036, A8s:0.003, A7s:0.008, A6s:0.157, A5s:0.394, A4s:0.282, A3s:0.028, A2s:0.121, AKo:0.337, AQo:0.057, AJo:0.022, ATo:0.196, A4o:0.001, A3o:0.001, KQs:0.004, KJs:0.011, KTs:0.002, K9s:0.032, K8s:0.261, K7s:0.175, K6s:0.016, K5s:0.049, K4s:0.308, K3s:0.019, K2s:0.003, KQo:0.083, KJo:0.063, KTo:0.036, K7o:0.001, QJs:0.129, QTs:0.004, Q9s:0.065, Q8s:0.105, JTs:0.003, J9s:0.022, T7s:0.001, 98s:0.001, 87s:0.007, 76s:0.002, 75s:0.022, 65s:0.087, 54s:0.113, 53s:0.001` },
          { action: "call", min: 0.05, range: `KK:0.415, QQ:0.999, JJ:0.926, TT:0.821, 99:0.984, 88:0.911, 77:0.938, 66:0.647, 55:0.781, 44:0.164, 33:0.051, AKs:0.359, AQs:0.991, AJs:0.846, ATs:0.998, A9s:0.940, A8s:0.810, A7s:0.369, A6s:0.211, A5s:0.554, A4s:0.004, A3s:0.016, A2s:0.429, AKo:0.207, AQo:0.402, AJo:0.897, ATo:0.276, KQs:0.992, KJs:0.969, KTs:0.996, K9s:0.742, K8s:0.257, K7s:0.026, K6s:0.042, KQo:0.737, KJo:0.028, QJs:0.850, QTs:0.979, JTs:0.870, J9s:0.001, J8s:0.002, T9s:0.887, T8s:0.001, T7s:0.033, 98s:0.005, 87s:0.161, 86s:0.001, 85s:0.002, 76s:0.414, 65s:0.810, 54s:0.137` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "50bb eff UTG open chase",
    label: "UTG 50bb eff Open（クラブマッチ）",
    questionBuilder: (hand) => ({
      hand,
      pos: "UTG",
      eff: 50,
      facing: "Unopened",
      stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
      options: ["Fold","open 2.3bb"],
    }),
    bands: [
          { action: "open", min: 0.05, range: `99+, 88:0.997, 77:0.999, 66:0.999, 55:0.729, A9s+, A8s:0.999, A7s, A6s:0.999, A5s:0.999, A4s:0.999, A3s, A2s:0.997, ATo+, A9o:0.996, A8o:0.451, A7o:0.055, A5o:0.946, A4o:0.073, A3o:0.002, KJs+, KTs:0.999, K9s:0.995, K8s:0.978, K7s:0.995, K6s:0.970, K5s:0.904, K4s:0.350, K3s:0.011, KJo+, KTo:0.583, K5o:0.001, QJs, QTs:0.999, Q9s:0.964, Q8s:0.085, Q7s:0.012, QJo:0.483, QTo:0.003, JTs:0.997, J9s:0.714, T9s:0.959, T8s:0.710, 98s:0.013, 76s:0.005` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "50bb eff HJ open chase",
    label: "HJ 50bb eff Open（クラブマッチ）",
    questionBuilder: (hand) => ({
      hand,
      pos: "HJ",
      eff: 50,
      facing: "Unopened",
      stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
      options: ["Fold","open 2.3bb"],
    }),
    bands: [
          { action: "open", min: 0.05, range: `99+, 88:0.999, 77, 66:0.997, 55:0.997, 44:0.618, 33:0.001, A8s+, A7s:0.999, A6s-A2s, A8o+, A7o:0.931, A6o:0.023, A5o:0.998, A4o:0.253, A3o:0.003, A2o:0.001, KQs, KJs:0.999, KTs, K9s:0.991, K8s, K7s:0.997, K6s:0.998, K5s:0.992, K4s:0.911, K3s:0.361, K2s:0.001, KJo+, KTo:0.999, K9o:0.001, QJs, QTs:0.999, Q9s:0.992, Q8s:0.923, Q7s:0.006, Q6s:0.294, QJo:0.998, QTo:0.537, JTs:0.998, J9s:0.984, J8s:0.867, JTo:0.466, T9s:0.986, T8s:0.934, T7s:0.581, 98s:0.808, 97s:0.158, 87s:0.078, 86s:0.006, 76s:0.385, 65s:0.693` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "50bb eff CO open chase",
    label: "CO 50bb eff Open（クラブマッチ）",
    questionBuilder: (hand) => ({
      hand,
      pos: "CO",
      eff: 50,
      facing: "Unopened",
      stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
      options: ["Fold","open 2.3bb"],
    }),
    bands: [
          { action: "open", min: 0.05, range: `66+, 55:0.999, 44:0.998, 33:0.415, 22:0.007, A2s+, A7o+, A6o:0.997, A5o, A4o:0.994, A3o:0.320, A2o:0.009, KTs+, K9s:0.999, K8s:0.999, K7s:0.996, K6s:0.999, K5s:0.996, K4s:0.996, K3s, K2s:0.989, KTo+, K9o:0.998, K8o:0.006, K7o:0.003, K6o:0.001, K4o:0.001, QJs:0.999, QTs, Q9s:0.994, Q8s, Q7s:0.951, Q6s:0.613, Q5s:0.966, Q4s:0.287, Q3s:0.001, QJo, QTo:0.998, Q9o:0.030, JTs, J9s:0.994, J8s:0.998, J7s:0.971, J6s:0.006, J5s:0.154, J4s:0.035, J2s:0.001, JTo:0.999, J9o:0.001, T9s:0.998, T8s:0.996, T7s:0.911, T6s:0.009, T9o:0.531, 98s:0.988, 97s:0.975, 96s:0.215, 87s:0.919, 86s:0.910, 76s:0.966, 75s:0.210, 65s:0.864, 54s:0.168` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "50bb eff BTN open chase",
    label: "BTN 50bb eff Open（クラブマッチ）",
    questionBuilder: (hand) => ({
      hand,
      pos: "BTN",
      eff: 50,
      facing: "Unopened",
      stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
      options: ["Fold","open 2.3bb"],
    }),
    bands: [
          { action: "open", min: 0.05, range: `55+, 44:0.999, 33-22, A2s+, A2o+, KTs+, K9s:0.999, K8s-K6s, K5s:0.997, K4s-K2s, K6o+, K5o:0.995, K4o:0.096, K3o:0.001, K2o:0.002, Q8s+, Q7s:0.999, Q6s:0.992, Q5s:0.998, Q4s:0.996, Q3s:0.998, Q2s:0.968, Q9o+, Q8o:0.986, Q7o:0.559, Q6o:0.004, JTs, J9s:0.998, J8s:0.998, J7s:0.998, J6s:0.994, J5s:0.996, J4s:0.950, J3s:0.520, J2s:0.290, J9o+, J8o:0.990, T7s+, T6s:0.999, T5s:0.927, T4s:0.848, T3s:0.386, T9o, T8o:0.991, T7o:0.440, 98s, 97s:0.999, 96s:0.992, 95s:0.742, 94s:0.025, 98o:0.972, 97o:0.004, 87s:0.997, 86s:0.991, 85s:0.996, 87o:0.428, 76s:0.999, 75s:0.991, 74s:0.618, 76o:0.203, 65s:0.999, 64s:0.862, 63s:0.001, 65o:0.004, 54s:0.998, 53s:0.978, 52s:0.001, 43s:0.003` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
  {
    id: "50bb eff BBvsUTG chase",
    label: "BB 50bb eff BBvsUTG（クラブマッチ）",
    questionBuilder: (hand) => ({
      hand,
      pos: "BB",
      eff: 50,
      facing: "UTG open 2.3x",
      stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
      options: ["Fold","call", "3bet 8.5bb"],
    }),
    bands: [
          { action: "3bet 8.5bb", min: 0.05, range: `AA, KK:0.664, AKs:0.818, AQs:0.012, A9s:0.038, A7s:0.163, A6s:0.261, A5s:0.118, A4s:0.691, A3s:0.815, A2s:0.412, AKo:0.542, AQo:0.017, ATo:0.038, A9o:0.010, A8o:0.061, A7o:0.533, A6o:0.151, A5o:0.349, A4o:0.523, A3o:0.534, A2o:0.057, KTs:0.003, K7s:0.096, K6s:0.004, K5s:0.423, K4s:0.044, K3s:0.001, K2s:0.100, KJo:0.047, KTo:0.033, K9o:0.103, K8o:0.046, K7o:0.010, K6o:0.039, K5o:0.038, K4o:0.023, K3o:0.018, K2o:0.002, QJs:0.009, QTs:0.001, Q9s:0.015, Q8s:0.039, Q5s:0.004, Q4s:0.001, Q2s:0.095, QJo:0.029, QTo:0.066, Q9o:0.067, Q8o:0.051, JTs:0.005, J9s:0.001, J7s:0.141, J5s:0.155, J3s:0.040, J2s:0.007, T7s:0.001, T6s:0.006, T3s:0.005, T9o:0.001, T8o:0.013, 98s:0.030, 97s:0.055, 95s:0.038, 93s:0.003, 92s:0.001, 98o:0.015, 87s:0.080, 83s:0.001, 87o:0.042, 76s:0.008, 76o:0.027, 75o:0.025, 62s:0.043, 54s:0.055, 52s:0.003, 43s:0.025` },
          { action: "call", min: 0.05, range: `KK:0.336, QQ-22, AKs:0.182, AQs:0.988, AJs-ATs, A9s:0.962, A8s, A7s:0.837, A6s:0.738, A5s:0.881, A4s:0.308, A3s:0.184, A2s:0.585, AKo:0.458, AQo:0.983, AJo, ATo:0.962, A9o:0.989, A8o:0.933, A7o:0.418, A6o:0.342, A5o:0.605, A4o:0.452, A3o:0.025, KJs+, KTs:0.997, K9s:0.992, K8s, K7s:0.904, K6s:0.995, K5s:0.576, K4s:0.939, K3s:0.991, K2s:0.886, KQo, KJo:0.953, KTo:0.967, K9o:0.722, K8o:0.281, K7o:0.177, QJs:0.991, QTs:0.999, Q9s:0.984, Q8s:0.960, Q7s:0.999, Q6s:0.999, Q5s:0.990, Q4s:0.991, Q3s:0.999, Q2s:0.898, QJo:0.971, QTo:0.928, Q9o:0.616, Q8o:0.150, JTs:0.994, J9s:0.999, J8s:0.997, J7s:0.857, J6s:0.991, J5s:0.449, J4s:0.725, J3s:0.418, J2s:0.075, JTo:0.994, J9o:0.600, J8o:0.003, T9s:0.999, T8s:0.995, T7s:0.999, T6s:0.986, T5s:0.989, T4s:0.298, T3s:0.078, T2s:0.001, T9o:0.988, T8o:0.707, 98s:0.966, 97s:0.944, 96s:0.998, 95s:0.284, 94s:0.332, 93s:0.136, 92s:0.171, 98o:0.798, 87s:0.918, 86s:0.993, 85s:0.998, 84s:0.977, 83s:0.002, 87o:0.618, 86o:0.001, 76s:0.992, 75s, 74s:0.988, 73s:0.461, 72s:0.006, 76o:0.967, 75o:0.257, 65s, 64s:0.999, 63s:0.974, 62s:0.683, 65o:0.978, 64o:0.141, 54s:0.945, 53s:0.997, 52s:0.982, 54o:0.517, 43s:0.971, 42s:0.994, 32s:0.734` },
    ],
    answerBuilder: (pattern, hand, _weight, optionsBB) =>
      ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
  },
];
