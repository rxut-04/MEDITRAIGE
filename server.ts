import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes (Mocking FastAPI structure)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Abhyas AI API" });
  });

  const QUESTIONS = [
    {
      id: "q1",
      subject: "Physics",
      chapter: "Thermodynamics",
      topic: "First Law of Thermodynamics",
      difficulty: "medium",
      text: "A gas undergoes an isothermal process. Which of the following is TRUE?",
      correct_option: "c",
      explanation: "In an isothermal process, temperature remains constant. Therefore, internal energy does not change. By the first law: ΔU = Q - W. Since ΔU = 0, Q = W.",
      avg_time_seconds: 75
    },
    {
      id: "q2",
      subject: "Physics",
      chapter: "Kinematics",
      topic: "Projectile Motion",
      difficulty: "easy",
      text: "A projectile is fired at 30° to the horizontal with initial velocity 40 m/s. What is the maximum height reached? (g = 10 m/s²)",
      correct_option: "b",
      explanation: "Maximum height H = (u²sin²θ)/(2g) = (40² × sin²30°)/(2×10) = (1600 × 0.25)/20 = 400/20 = 20 m.",
      avg_time_seconds: 60
    },
    {
      id: "q3",
      subject: "Chemistry",
      chapter: "Chemical Bonding",
      topic: "Hybridization",
      difficulty: "medium",
      text: "The hybridization of the central atom in SF6 is:",
      correct_option: "c",
      explanation: "SF6 has 6 bond pairs and 0 lone pairs around Sulphur. Total electron pairs = 6. This requires sp³d² hybridization giving an octahedral geometry.",
      avg_time_seconds: 50
    },
    {
      id: "q4",
      subject: "Chemistry",
      chapter: "Electrochemistry",
      topic: "Nernst Equation",
      difficulty: "hard",
      text: "For a cell reaction with n=2, if E°cell = 1.1V and reaction quotient Q = 100, what is the cell EMF at 25°C? (0.0592/n × logQ)",
      correct_option: "b",
      explanation: "Using Nernst equation: E = E° - (0.0592/n)logQ = 1.1 - (0.0592/2)×log100 = 1.1 - (0.0296×2) = 1.1 - 0.0592 = 1.0408 ≈ 1.041V.",
      avg_time_seconds: 90
    },
    {
      id: "q5",
      subject: "Biology",
      chapter: "Cell Biology",
      topic: "Cell Division",
      difficulty: "easy",
      text: "During which phase of mitosis do chromosomes align at the equatorial plate?",
      correct_option: "b",
      explanation: "In Metaphase, spindle fibres attach to the centromeres of chromosomes and pull them to align at the cell's equatorial plate (metaphase plate). This is the defining event of Metaphase.",
      avg_time_seconds: 30
    },
    {
      id: "q6",
      subject: "Biology",
      chapter: "Genetics",
      topic: "Mendelian Genetics",
      difficulty: "medium",
      text: "In a dihybrid cross between AABB × aabb, what fraction of F2 offspring will show the aabb phenotype?",
      correct_option: "c",
      explanation: "In a standard dihybrid cross (9:3:3:1 ratio in F2), the double recessive phenotype (aabb) appears in 1/16 of the offspring. Each trait independently has a 1/4 chance of being recessive homozygous, so 1/4 × 1/4 = 1/16.",
      avg_time_seconds: 65
    },
    {
      id: "q7",
      subject: "Physics",
      chapter: "Optics",
      topic: "Refraction",
      difficulty: "medium",
      text: "A ray of light passes from air (n=1) into glass (n=1.5). If the angle of incidence is 45°, what is the angle of refraction?",
      correct_option: "b",
      explanation: "Snell's Law: n1×sinθ1 = n2×sinθ2. So 1×sin45° = 1.5×sinθ2. sinθ2 = sin45°/1.5 = 0.7071/1.5 = 0.4714. θ2 = arcsin(0.4714) ≈ 28.1°.",
      avg_time_seconds: 70
    },
    {
      id: "q8",
      subject: "Chemistry",
      chapter: "Organic Chemistry",
      topic: "Reaction Mechanisms",
      difficulty: "hard",
      text: "Which reagent converts a primary alcohol to an aldehyde WITHOUT further oxidation to carboxylic acid?",
      correct_option: "c",
      explanation: "PCC (Pyridinium Chlorochromate) in DCM is a mild oxidizing agent that selectively oxidizes primary alcohols to aldehydes and stops there. Strong oxidizers like KMnO4 or K2Cr2O7 continue oxidizing the aldehyde to carboxylic acid.",
      avg_time_seconds: 80
    },
    {
      id: "q9",
      subject: "Biology",
      chapter: "Human Physiology",
      topic: "Nervous System",
      difficulty: "easy",
      text: "The functional unit of the nervous system is the:",
      correct_option: "b",
      explanation: "The Neuron is the structural and functional unit of the nervous system. It is specialized to receive, process, and transmit electrical and chemical signals.",
      avg_time_seconds: 20
    },
    {
      id: "q10",
      subject: "Physics",
      chapter: "Modern Physics",
      topic: "Photoelectric Effect",
      difficulty: "medium",
      text: "In the photoelectric effect, increasing the INTENSITY of incident light (above threshold frequency) will:",
      correct_option: "b",
      explanation: "In the photoelectric effect, the kinetic energy of emitted electrons depends on FREQUENCY (not intensity). Intensity determines the number of photons hitting the surface per second — more photons means more electrons emitted. Stopping potential and KE are unaffected by intensity.",
      avg_time_seconds: 75
    }
  ];

  app.post("/api/exam/submit", express.json(), (req, res) => {
    const submission = req.body;
    const answersMap = {};
    submission.answers.forEach(a => {
      answersMap[a.question_id] = a;
    });

    const question_results = [];
    const subject_data = {};
    const time_category_counts = {
      "fast_correct": 0, "slow_correct": 0,
      "fast_wrong": 0, "slow_wrong": 0, "skipped": 0
    };

    let total_score = 0;
    let correct_count = 0;
    let wrong_count = 0;
    let skipped_count = 0;

    QUESTIONS.forEach(q => {
      const answer = answersMap[q.id];
      const selected = answer ? answer.selected_option : null;
      const time_ms = answer ? answer.time_spent_ms : 0;
      const is_skipped = selected === null;
      const is_correct = !is_skipped && selected === q.correct_option;

      let marks = 0;
      if (is_skipped) {
        skipped_count++;
      } else if (is_correct) {
        marks = 4;
        correct_count++;
      } else {
        marks = -1;
        wrong_count++;
      }

      total_score += marks;

      // Classification
      let category = "skipped";
      if (!is_skipped) {
        const time_sec = time_ms / 1000;
        if (is_correct) {
          category = time_sec <= q.avg_time_seconds * 1.2 ? "fast_correct" : "slow_correct";
        } else {
          category = time_sec <= q.avg_time_seconds * 0.5 ? "fast_wrong" : "slow_wrong";
        }
      }
      time_category_counts[category]++;

      const subj = q.subject;
      if (!subject_data[subj]) {
        subject_data[subj] = { correct: 0, wrong: 0, skipped: 0, total_time_ms: 0, count: 0 };
      }
      subject_data[subj].total_time_ms += time_ms;
      subject_data[subj].count++;
      if (is_correct) subject_data[subj].correct++;
      else if (is_skipped) subject_data[subj].skipped++;
      else subject_data[subj].wrong++;

      question_results.push({
        question_id: q.id,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        difficulty: q.difficulty,
        question_text: q.text,
        selected_option: selected,
        correct_option: q.correct_option,
        is_correct,
        is_skipped,
        marks_awarded: marks,
        time_spent_ms: time_ms,
        avg_time_seconds: q.avg_time_seconds,
        time_category: category,
        explanation: q.explanation
      });
    });

    const subject_breakdown = {};
    Object.keys(subject_data).forEach(subj => {
      const data = subject_data[subj];
      subject_breakdown[subj] = {
        correct: data.correct,
        wrong: data.wrong,
        skipped: data.skipped,
        avg_time_ms: data.count > 0 ? Math.floor(data.total_time_ms / data.count) : 0
      };
    });

    res.json({
      student_id: submission.student_id,
      total_score,
      max_score: 40,
      percentage: Math.round((Math.max(total_score, 0) / 40) * 1000) / 10,
      correct_count,
      wrong_count,
      skipped_count,
      total_time_ms: submission.total_time_spent_ms,
      question_results,
      subject_breakdown,
      time_category_breakdown: time_category_counts
    });
  });

  const services = ["exam", "analytics", "ai-mentor"];
  services.forEach(service => {
    app.get(`/api/${service}/health`, (req, res) => {
      res.json({ status: "ok", service });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), 'frontend')
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Abhyas AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
