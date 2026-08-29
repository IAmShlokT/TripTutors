import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI client
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper function to call Gemini API with automatic retry and model fallback for 503/429/UNAVAILABLE errors
async function generateContentWithRetry(ai: GoogleGenAI, params: any) {
  const primaryModel = params.model || 'gemini-3.7-flash';
  const isSpecialized = primaryModel.includes('tts') || primaryModel.includes('image');

  const modelsToTry = isSpecialized
    ? [primaryModel]
    : [primaryModel, 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const modelName of uniqueModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const code = err?.code || err?.status;

        const isQuotaError = code === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded');
        const isTransient = code === 503 || code === 'UNAVAILABLE' || isQuotaError ||
          msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('demand');

        const shortMsg = msg.length > 120 ? msg.slice(0, 120) + '...' : msg;
        console.warn(`[Gemini API] Call with model "${modelName}" (attempt ${attempt}) failed: ${shortMsg}`);

        // If it's a quota error on a specialized model (e.g. image generation free tier exhausted), break early to allow fallback
        if (isQuotaError && isSpecialized) {
          throw err;
        }

        // On 503 / high demand spikes, jump directly to the next fallback model instead of wasting retries on an overloaded model
        if (code === 503 || msg.includes('503') || msg.includes('demand')) {
          break;
        }

        if (attempt < 2 && isTransient) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
    }
  }

  throw lastError;
}

function parseJsonResponse(rawText: string) {
  if (!rawText) return {};
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

// System Instruction Generator tailored to Grade Band and Subject
function getSystemInstruction(gradeBand: string, subject: string) {
  let gradeGuide = '';
  switch (gradeBand) {
    case 'PreK-2':
      gradeGuide = `Target Audience: Early learners (ages 4-8, Pre-K to Grade 2).
Language & Tone: Use super simple, warm, playful, and clear sentence structures. Keep paragraphs very short (1-3 lines). Use fun emojis! Focus on basic counting, shapes, phonics, senses, and community helpers. Celebrate effort enthusiastically ("Awesome job trying!", "You are a star!").`;
      break;
    case '3-5':
      gradeGuide = `Target Audience: Upper elementary students (ages 8-11, Grades 3-5).
Language & Tone: Friendly, patient, encouraging teacher voice. Break explanations into clear numbered steps. Use relatable everyday analogies (e.g., sharing pizza for fractions, growing plants for life cycles). Ask guiding questions to check understanding.`;
      break;
    case '6-8':
      gradeGuide = `Target Audience: Middle school students (ages 11-14, Grades 6-8).
Language & Tone: Supportive, structured, and engaging. Introduce clear academic terms with quick definitions. Break down multi-step equations, scientific reasoning, and essay structure. Emphasize growth mindset ("Mistakes help your brain grow").`;
      break;
    case '9-12':
    default:
      gradeGuide = `Target Audience: High school students (ages 14-18, Grades 9-12).
Language & Tone: Respectful, precise, and academically rigorous yet supportive. Use proper subject terminology (e.g., quadratic formula, thesis statements, cell organelle functions, constitutional amendments). Focus on step-by-step logic, evidence-based reasoning, and exam preparation.`;
      break;
  }

  let subjectPersona = '';
  switch (subject) {
    case 'Math':
      subjectPersona = `SPECIALIST ROLE: Master Mathematics Tutor (Active Subject: Math).

SUPER PROFICIENCY IN MATH:
- You are exceptionally talented, deeply knowledgeable, and authoritative in Mathematics (arithmetic, algebra, geometry, word problems, statistics, fractions, calculus, mental math).
- You explain math concepts with brilliant step-by-step logic, fun real-world examples, and clear mathematical reasoning.

STRICT UNFAMILIARITY & NON-PROFICIENCY IN OTHER SUBJECTS (ELA, Science, Social Studies):
- You are ONLY a Math specialist. You are completely NOT proficient in English/Reading/Writing, Science, or Social Studies/History.
- IF THE STUDENT ASKS A QUESTION ABOUT ELA, SCIENCE, OR SOCIAL STUDIES (e.g., grammar rules, essay writing, book reports, biology, chemistry, photosynthesis, history, geography, presidents, or wars):
  1. ADMIT WITH LIGHTHEARTED HUMOR AND HONESTY that you are NOT proficient at that subject (for example: "Oh goodness, grammar and reading make my brain spin!", "Chemistry formulas and history dates are way outside my comfort zone! I am strictly a Math tutor.").
  2. POLITE REDIRECTION: Warmly tell the student to switch to the corresponding subject tab (ELA, Science, or Social Studies) at the top of the screen to talk to a specialist in that subject.
  3. REDIRECT TO MATH: Ask if they have any math problems, fractions, geometry questions, or word problems they'd like to solve together instead!`;
      break;

    case 'ELA':
      subjectPersona = `SPECIALIST ROLE: Master Reading & Writing Tutor (Active Subject: ELA / English Language Arts).

SUPER PROFICIENCY IN ELA:
- You are exceptionally talented, deeply knowledgeable, and authoritative in English Language Arts, reading comprehension, essay writing, grammar, vocabulary, literature, and creative writing.
- You analyze texts, refine essays, clarify grammar rules, and build vocabulary with supreme skill and literary enthusiasm.

STRICT UNFAMILIARITY & NON-PROFICIENCY IN OTHER SUBJECTS (Math, Science, Social Studies):
- You are ONLY an ELA specialist. You are completely NOT proficient in Math, Science, or Social Studies/History.
- IF THE STUDENT ASKS A QUESTION ABOUT MATH, SCIENCE, OR SOCIAL STUDIES (e.g., solving math equations, physics, chemistry, biology, historical events, civics, or geography):
  1. ADMIT WITH LIGHTHEARTED HUMOR AND HONESTY that you are NOT proficient at that subject (for example: "Math equations and numbers look like alien code to me!", "Scientific formulas and historical timelines confuse me—I live and breathe words and literature!").
  2. POLITE REDIRECTION: Warmly tell the student to switch to the Math, Science, or Social Studies tab at the top of the screen to talk to a specialist in that subject.
  3. REDIRECT TO ELA: Ask if they want help with a story, essay draft, reading passage, or grammar question instead!`;
      break;

    case 'Science':
      subjectPersona = `SPECIALIST ROLE: Chief Science Explorer & Tutor (Active Subject: Science).

SUPER PROFICIENCY IN SCIENCE:
- You are exceptionally talented, deeply knowledgeable, and authoritative in Science (biology, physics, chemistry, earth & space science, ecology, scientific method, and lab experiments).
- You explain scientific phenomena, ecosystems, atoms, forces, and space with supreme mastery and contagious wonder.

STRICT UNFAMILIARITY & NON-PROFICIENCY IN OTHER SUBJECTS (Math, ELA, Social Studies):
- You are ONLY a Science specialist. You are completely NOT proficient in pure Math, ELA (Reading/Writing/Grammar), or Social Studies/History.
- IF THE STUDENT ASKS A QUESTION ABOUT MATH, ELA, OR SOCIAL STUDIES (e.g., solving pure algebra equations, editing essay grammar/spelling, or asking about historical wars, politics, or geography):
  1. ADMIT WITH LIGHTHEARTED HUMOR AND HONESTY that you are NOT proficient at that non-science topic (for example: "My brain is 100% wired for scientific experiments! Pure algebra proofs, grammar drills, and historical politics confuse me completely!").
  2. POLITE REDIRECTION: Warmly tell the student to switch to the Math, ELA, or Social Studies tab at the top of the screen to consult a specialist in those fields.
  3. REDIRECT TO SCIENCE: Ask what science experiment, space mystery, or natural wonder they want to explore together instead!`;
      break;

    case 'Social Studies':
    default:
      subjectPersona = `SPECIALIST ROLE: Master Historian & Social Studies Tutor (Active Subject: Social Studies).

SUPER PROFICIENCY IN SOCIAL STUDIES:
- You are exceptionally talented, deeply knowledgeable, and authoritative in Social Studies (world history, US history, civics, government, geography, world cultures, and economics).
- You bring historic civilizations, maps, constitution rights, and global geography to life with supreme mastery and vivid storytelling.

STRICT UNFAMILIARITY & NON-PROFICIENCY IN OTHER SUBJECTS (Math, ELA, Science):
- You are ONLY a Social Studies specialist. You are completely NOT proficient in Math, ELA (Reading/Writing/Grammar), or Science.
- IF THE STUDENT ASKS A QUESTION ABOUT MATH, ELA, OR SCIENCE (e.g., solving algebra equations, grammar drills, essay formatting, chemical reactions, or biology organelle functions):
  1. ADMIT WITH LIGHTHEARTED HUMOR AND HONESTY that you are NOT proficient at that subject (for example: "I know maps, historical eras, and world cultures inside out, but math formulas, grammar rules, and biology equations are totally alien to me!").
  2. POLITE REDIRECTION: Warmly tell the student to switch to the Math, ELA, or Science tab at the top of the screen to get expert help in those subjects.
  3. REDIRECT TO SOCIAL STUDIES: Ask what historical era, ancient civilization, map mystery, or country culture they'd like to discover together!`;
      break;
  }

  return `You are an adaptive, kid-friendly virtual tutor specializing in ${subject} tailored for ${gradeBand} students.

${gradeGuide}

${subjectPersona}

Core Principles & Rules:
1. ALWAYS reinforce effort, strategies, and progress. Encourage a growth mindset.
2. NEVER give away final answers directly if the student is working through a problem in your active subject (${subject}). Guide them step-by-step with scaffolding and hints.
3. If the student asks for a hint, provide a small, helpful clue without giving the whole answer.
4. Keep explanations original and school-appropriate. Do NOT reproduce copyrighted textbook or test content.
5. In Math & Science (when active), show clear logical steps.
6. In ELA & Social Studies (when active), model evidence-based thinking and clear organization.
7. Offer quick follow-up questions or 1-2 interactive choices at the end of your explanation to keep the student engaged.
8. FORMATTING RULE: NEVER output raw symbols like asterisks (** or *), hashes (#), or LaTeX dollar signs ($ or $$). Write all words, math equations, and headers in clear, plain natural text (for example, write 'x squared' or 'x = 2' instead of '$x^2$' or '$x = 2$'). Do not wrap words in double asterisks.
9. DIAGRAM REQUEST RULE: If the student asks you to draw, sketch, show, or create a diagram, picture, or visual illustration in your active subject (${subject}), acknowledge their request enthusiastically (e.g., 'Here is a visual diagram for you!') and keep your accompanying text brief, as a visual diagram picture is automatically generated and displayed right below your message.`;
}

// 1. Conversational Tutor Chat Endpoint
app.post('/api/tutor/chat', async (req, res) => {
  try {
    const { messages, gradeBand = '3-5', subject = 'Math', topic = '' } = req.body;
    const ai = getAIClient();

    const systemInstruction = getSystemInstruction(gradeBand, subject) +
      (topic ? `\nCurrent Topic Focus: ${topic}` : '');

    // Format chat history for Gemini
    const contents = messages.map((m: { sender: string; text: string }) => ({
      role: m.sender === 'tutor' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    // Choose model: gemini-3.7-flash for fast interactive tutor chat
    const modelName = 'gemini-3.7-flash';

    const response = await generateContentWithRetry(ai, {
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I'm here to help! What shall we learn next?";

    res.json({ text: replyText });
  } catch (error: any) {
    console.error('Error in /api/tutor/chat:', error);
    res.json({ 
      text: "I experienced a brief server connection pause due to high traffic. Please try sending your message again in a moment!" 
    });
  }
});

// 2. Practice Generator Endpoint (JSON schema output)
app.post('/api/tutor/practice', async (req, res) => {
  try {
    const { gradeBand = '3-5', subject = 'Math', topic = 'Fractions', count = 4 } = req.body;
    const ai = getAIClient();

    const prompt = `Generate ${count} practice questions for a ${gradeBand} student in ${subject} on the topic "${topic}".
Make questions age-appropriate, clear, and engaging.
Provide 4 options for each question (A, B, C, D), indicate the correct answer, give a 1-sentence hint, and a clear step-by-step explanation.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(gradeBand, subject),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  hints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctAnswer', 'hints', 'explanation'],
              },
            },
          },
          required: ['title', 'questions'],
        },
      },
    });

    const data = parseJsonResponse(response.text || '{}');
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/tutor/practice:', error);
    res.status(500).json({ error: error.message || 'Failed to generate practice set.' });
  }
});

// 3. Reading Comprehension Passage Endpoint
app.post('/api/tutor/reading', async (req, res) => {
  try {
    const { gradeBand = '3-5', topic = 'Space Exploration' } = req.body;
    const ai = getAIClient();

    const prompt = `Create an original, engaging reading passage for a ${gradeBand} student about "${topic}".
The passage should be roughly ${gradeBand === 'PreK-2' ? '80-120' : gradeBand === '3-5' ? '180-250' : '300-450'} words.
Also generate:
1. 3 key vocabulary words with simple definitions.
2. 4 multiple-choice comprehension questions covering: Main Idea, Detail, Vocabulary context, and Inference.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(gradeBand, 'ELA'),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            passageText: { type: Type.STRING },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ['word', 'definition'],
              },
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['id', 'type', 'question', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['title', 'passageText', 'vocabulary', 'questions'],
        },
      },
    });

    const data = parseJsonResponse(response.text || '{}');
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/tutor/reading:', error);
    res.status(500).json({ error: error.message || 'Failed to generate reading passage.' });
  }
});

// 4. Writing Feedback & Outliner Endpoint
app.post('/api/tutor/writing-feedback', async (req, res) => {
  try {
    const { gradeBand = '6-8', topic = '', draft = '', action = 'feedback' } = req.body;
    const ai = getAIClient();

    if (action === 'outline') {
      const prompt = `Create a structured paragraph/essay outline for a ${gradeBand} student writing about: "${topic}".
Include a clear main topic statement/thesis, and 3 main body sections with 2 bullet points each.`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: getSystemInstruction(gradeBand, 'ELA'),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              thesisOrMainIdea: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    keyPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['heading', 'keyPoints'],
                },
              },
            },
            required: ['topic', 'thesisOrMainIdea', 'sections'],
          },
        },
      });

      return res.json(parseJsonResponse(response.text || '{}'));
    }

    // Default: Feedback on student draft
    const prompt = `Analyze this writing draft by a ${gradeBand} student on topic "${topic}":
"${draft}"

Provide constructive feedback that preserves their voice:
1. Highlight 2-3 specific strengths.
2. Offer 2 concrete suggestions for improvement (e.g. word choice, transitions, organization).
3. Notes on grammar & clarity (gentle and supportive).
4. An encouraging closing remark.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(gradeBand, 'ELA'),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            organizationNotes: { type: Type.STRING },
            grammarAndClarity: { type: Type.STRING },
            encouragement: { type: Type.STRING },
          },
          required: ['strengths', 'suggestions', 'organizationNotes', 'grammarAndClarity', 'encouragement'],
        },
      },
    });

    res.json(parseJsonResponse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/tutor/writing-feedback:', error);
    res.status(500).json({ error: error.message || 'Failed to process writing request.' });
  }
});

// 5. Flashcards Generator Endpoint
app.post('/api/tutor/flashcards', async (req, res) => {
  try {
    const { gradeBand = '3-5', subject = 'Science', topic = 'Water Cycle', count = 5 } = req.body;
    const ai = getAIClient();

    const prompt = `Create ${count} flashcards for a ${gradeBand} student in ${subject} on topic "${topic}".
Each card should have a clear front question/term, back concise explanation/answer, and a helpful hint.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(gradeBand, subject),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ['front', 'back', 'hint'],
              },
            },
          },
          required: ['title', 'cards'],
        },
      },
    });

    res.json(parseJsonResponse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/tutor/flashcards:', error);
    res.status(500).json({ error: error.message || 'Failed to generate flashcards.' });
  }
});

// 6. Text-To-Speech Endpoint (gemini-3.1-flash-tts-preview)
app.post('/api/tutor/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required.' });
    }

    const ai = getAIClient();
    const promptText = `Speak cheerfully and clearly for a student: ${text.slice(0, 500)}`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = inlineData?.data;
    const mimeType = inlineData?.mimeType || 'audio/wav';

    if (base64Audio) {
      res.json({ audioBase64: base64Audio, mimeType });
    } else {
      res.status(500).json({ error: 'Audio data not generated.' });
    }
  } catch (error: any) {
    console.error('Error in /api/tutor/tts:', error);
    res.status(500).json({ error: error.message || 'Speech synthesis failed.' });
  }
});

// Track if specialized bitmap image generation model is rate limited or quota exhausted
let bitmapImageQuotaExhausted = false;

// 7. Visual Diagram / Educational Illustration Endpoint (gemini-3.1-flash-lite-image with SVG fallback)
app.post('/api/tutor/visual-aid', async (req, res) => {
  try {
    const { prompt, gradeBand = '3-5', subject = 'Science' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const ai = getAIClient();
    let imageUrl = '';

    // Attempt 1: Try Gemini bitmap image generation model if available & quota active
    if (!bitmapImageQuotaExhausted) {
      try {
        const fullPrompt = `A high-resolution, ultra-crisp educational vector diagram for a ${gradeBand} ${subject} student showing: ${prompt}. Clean bright white background. High-contrast bold typography with large, clear, readable English text labels placed on solid white label boxes. Uncluttered layout, clear pointing arrows, sharp vector shapes, friendly vector art style.`;

        const response = await generateContentWithRetry(ai, {
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: fullPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: '4:3',
            },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } catch (imgErr: any) {
        const msg = imgErr?.message || String(imgErr);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('Quota exceeded')) {
          bitmapImageQuotaExhausted = true;
          console.log('[Visual Aid] Image generation model quota reached. Switching directly to SVG vector diagram generation.');
        } else {
          console.warn('[Visual Aid] Bitmap image model unavailable, using SVG vector diagram fallback.');
        }
      }
    }

    // Attempt 2: Fall back to generating a high-clarity educational SVG diagram via gemini-3.6-flash
    if (!imageUrl) {
      try {
        const svgPrompt = `Create a clear, high-contrast, beautifully structured SVG educational diagram for a ${gradeBand} student studying ${subject} about: "${prompt}".

CRITICAL TEXT CLARITY & LEGIBILITY RULES:
1. Return ONLY valid, complete SVG code starting with <svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"> and ending with </svg>.
2. Do NOT wrap in markdown code blocks (\`\`\`xml or \`\`\`svg).
3. TEXT CLARITY IS MANDATORY:
   - Use large, bold font sizes for all text labels (font-size="16" to "22", font-weight="bold", font-family="system-ui, -apple-system, sans-serif").
   - EVERY text label MUST sit inside a high-contrast background pill or box (<rect rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>) so text never collides with background shapes or diagram lines.
   - Use ultra-clear, high-contrast text color (#0f172a dark charcoal/navy on white pills).
   - Space elements out generously across the 600x450 canvas. Never overlap text elements or shapes.
   - Use explicit arrows or leader lines pointing cleanly from labels to diagram components.
4. Use vibrant, modern colors with clean borders and high contrast.`;

        const svgResponse = await generateContentWithRetry(ai, {
          model: 'gemini-3.7-flash',
          contents: svgPrompt,
        });

        let rawSvg = svgResponse.text || '';
        rawSvg = rawSvg.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();

        if (rawSvg.includes('<svg') && rawSvg.includes('</svg>')) {
          const svgContent = rawSvg.substring(rawSvg.indexOf('<svg'), rawSvg.lastIndexOf('</svg>') + 6);
          const base64Svg = Buffer.from(svgContent, 'utf-8').toString('base64');
          imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
        }
      } catch (svgErr: any) {
        console.warn('[Visual Aid] SVG generation also encountered an error:', svgErr?.message || svgErr);
      }
    }

    // Fallback 3: Clean, styled default SVG card with ultra-clear text pills
    if (!imageUrl) {
      const safeTitle = String(prompt).replace(/[<>&'"]/g, '').slice(0, 45);
      const defaultSvg = `<svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <rect width="600" height="450" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <rect x="20" y="20" width="560" height="60" rx="12" fill="#2563eb"/>
        <text x="300" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="22" fill="#ffffff">Diagram: ${safeTitle}</text>
        
        <!-- Illustration Shapes -->
        <circle cx="300" cy="220" r="95" fill="#dbeafe" stroke="#3b82f6" stroke-width="4"/>
        <circle cx="300" cy="220" r="55" fill="#93c5fd" stroke="#1d4ed8" stroke-width="3"/>
        <circle cx="300" cy="220" r="20" fill="#1e40af"/>
        
        <!-- Labeled High-Contrast Text Pills -->
        <g transform="translate(60, 160)">
          <rect x="0" y="0" width="130" height="40" rx="8" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
          <text x="65" y="25" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="16" fill="#0f172a">Outer Layer</text>
          <line x1="130" y1="20" x2="210" y2="20" stroke="#2563eb" stroke-width="3" stroke-dasharray="4"/>
        </g>
        
        <g transform="translate(410, 200)">
          <line x1="0" y1="20" x2="-80" y2="20" stroke="#1d4ed8" stroke-width="3" stroke-dasharray="4"/>
          <rect x="0" y="0" width="130" height="40" rx="8" fill="#ffffff" stroke="#1d4ed8" stroke-width="2"/>
          <text x="65" y="25" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="16" fill="#0f172a">Inner Core</text>
        </g>
        
        <rect x="100" y="375" width="400" height="44" rx="10" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
        <text x="300" y="403" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="16" fill="#1e293b">Subject: ${subject} (${gradeBand})</text>
      </svg>`;
      const base64Svg = Buffer.from(defaultSvg, 'utf-8').toString('base64');
      imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
    }

    res.json({ imageUrl });
  } catch (error: any) {
    console.error('Error in /api/tutor/visual-aid:', error);
    res.status(500).json({ error: error.message || 'Failed to generate visual aid.' });
  }
});

// Server boot with Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Virtual Tutor Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
