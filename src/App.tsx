import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, 
  ScrollText, 
  GraduationCap, 
  Zap, 
  Briefcase, 
  Trophy, 
  Languages,
  Car,
  CheckCircle, 
  FileText,
  MapPin,
  Phone,
  Mail,
  Link as LinkIcon,
  Monitor,
  Sparkles,
  Loader2,
  Info,
  Plus,
  Trash2,
  Download,
  Send,
  Copy,
  Check
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const COMMON_HARD_SKILLS = [
  "Análise de dados",
  "Competência em tecnologia da informação",
  "Conhecimento contábil e financeiro",
  "Conhecimento em ferramentas de produtividade",
  "Conhecimento em uso do equipamento de proteção individual (EPI)",
  "Domínio de software específico da área",
  "Fluência em línguas estrangeiras",
  "Gerenciamento de projetos",
  "Habilidade em operar equipamentos técnicos",
  "Habilidades em marketing digital",
  "Matemática avançada",
  "Programação de computadores"
];

const COMMON_SOFT_SKILLS = [
  "Atenção aos Detalhes e Controle de Qualidade",
  "Capacidade de trabalhar sob pressão",
  "Comunicação eficaz",
  "Criatividade e Inovação",
  "Curiosidade e Aprendizagem Contínua",
  "Empatia e Escuta Ativa",
  "Ética no trabalho",
  "Fluência de ideias",
  "Inteligência Emocional",
  "Liderança e Influência Social",
  "Motivação e Autoconhecimento",
  "Organização e gestão do tempo",
  "Perfil Empreendedor",
  "Raciocínios indutivo e dedutivo",
  "Raciocínio matemático",
  "Repertório Tecnológico",
  "Resiliência, Flexibilidade, Agilidade",
  "Resolução de problemas complexos",
  "Trabalho em equipe"
];

interface EducationItem {
  school: string;
  course: string;
  level: string;
  period: string;
  details: string;
}

interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  description: string;
}

interface EventItem {
  institution: string;
  title: string;
  year: string;
  duration: string;
}

interface ResumeData {
  fullName: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  hardSkills: string;
  softSkills: string;
  driverLicense: string;
  languages: string;
  courses: EventItem[];
}

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function App() {
  const [step, setStep] = useState(0);
  const [xp, setXp] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHard, setIsGeneratingHard] = useState(false);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingExp, setIsGeneratingExp] = useState<{ [key: number]: boolean }>({});
  const [suggestedHardSkills, setSuggestedHardSkills] = useState<string[]>([]);
  const [suggestedSoftSkills, setSuggestedSoftSkills] = useState<string[]>([]);
  const [suggestedActivities, setSuggestedActivities] = useState<{ [key: number]: string[] }>({});
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const maxSteps = 9;

  const [data, setData] = useState<ResumeData>({
    fullName: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    linkedin: "",
    portfolio: "",
    summary: "",
    education: [{ school: "", course: "", level: "", period: "", details: "" }],
    experience: [{ company: "", role: "", period: "", description: "" }],
    hardSkills: "",
    softSkills: "",
    driverLicense: "",
    languages: "",
    courses: [{ institution: "", title: "", year: "", duration: "" }]
  });

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        const padding = window.innerWidth >= 1024 ? 80 : 32;
        const availableWidth = containerWidth - padding;
        const targetWidth = 794; 
        const newScale = Math.max(0.3, Math.min(availableWidth / targetWidth, 1));
        setPreviewScale(newScale);
      }
    };

    const observer = new ResizeObserver(updateScale);
    if (previewContainerRef.current) observer.observe(previewContainerRef.current);
    updateScale();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const progress = Math.round((step / maxSteps) * 100);
    setXp(progress);
  }, [step]);

  const handleChange = (field: keyof ResumeData, value: string, subField: string | null = null) => {
    if (subField) {
      setData(prev => ({ 
        ...prev, 
        [field]: { ...(prev[field] as any), [subField]: value } 
      }));
    } else {
      setData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleEducationChange = (index: number, field: keyof EducationItem, value: string) => {
    const newEducation = [...data.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setData(prev => ({ ...prev, education: newEducation }));
  };

  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { school: "", course: "", level: "", period: "", details: "" }]
    }));
  };

  const removeEducation = (index: number) => {
    if (data.education.length <= 1) return;
    const newEducation = data.education.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, education: newEducation }));
  };

  const handleExperienceChange = (index: number, field: keyof ExperienceItem, value: string) => {
    const newExperience = [...data.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setData(prev => ({ ...prev, experience: newExperience }));
  };

  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: "", role: "", period: "", description: "" }]
    }));
  };

  const removeExperience = (index: number) => {
    if (data.experience.length <= 1) return;
    const newExperience = data.experience.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, experience: newExperience }));
  };

  const handleEventChange = (index: number, field: keyof EventItem, value: string) => {
    const newEvents = [...data.courses];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setData(prev => ({ ...prev, courses: newEvents }));
  };

  const addEvent = () => {
    setData(prev => ({
      ...prev,
      courses: [...prev.courses, { institution: "", title: "", year: "", duration: "" }]
    }));
  };

  const removeEvent = (index: number) => {
    if (data.courses.length <= 1) return;
    const newEvents = data.courses.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, courses: newEvents }));
  };

  const downloadPDF = () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `Curriculo_${data.fullName || 'Export'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  const downloadDOC = () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;

    // Basic HTML structure for Word
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Currículo</title>"+
            "<style>"+
            "body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; }"+
            "h1 { color: #E30613; text-transform: uppercase; border-bottom: 2px solid #E30613; padding-bottom: 5px; }"+
            "h2 { color: #E30613; font-size: 14pt; border-bottom: 1px solid #ccc; margin-top: 20px; }"+
            "h3 { font-size: 12pt; margin-bottom: 5px; }"+
            ".contact-info { font-size: 10pt; margin-bottom: 20px; }"+
            "section { margin-bottom: 15px; }"+
            "p { margin: 5px 0; }"+
            "</style>"+
            "</head><body>";
    const footer = "</body></html>";
    
    // We try to clean up some of the lucide icons or specific web-only classes if needed, 
    // but for a simple export, the innerHTML is a good start.
    const sourceHTML = header + element.innerHTML + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = url;
    fileDownload.download = `Curriculo_${data.fullName || 'Export'}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
  };

  const sendToLibrary = () => {
    // 1. Download the DOC first so the user has the file ready to attach
    downloadDOC();
    
    // 2. Open the email client with pre-filled info
    const subject = encodeURIComponent(`Currículo Turbinado - ${data.fullName || 'Candidato'}`);
    const body = encodeURIComponent(`Olá equipe da Biblioteca SENAI-SP 9.14,\n\nEstou enviando meu currículo turbinado em anexo para os últimos retoques.\n\n(O arquivo foi baixado automaticamente em seu computador. Por favor, anexe-o a este e-mail).\n\nAtenciosamente,\n${data.fullName || 'Candidato'}`);
    
    const cc = data.email ? `&cc=${data.email}` : '';
    
    // Use a small delay to ensure the download starts before the mailto link triggers
    setTimeout(() => {
      window.location.href = `mailto:morgan.morgado@sp.senai.br?subject=${subject}&body=${body}${cc}`;
    }, 500);
  };

  const generateAISummary = async () => {
    if (!data.fullName && !data.hardSkills) {
      alert("Por favor, preencha pelo menos seu nome e competências para gerar um resumo melhor.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const prompt = `Aja como um especialista em recrutamento e seleção. Escreva um resumo profissional/mini bio de no máximo 300 palavras no currículo que está sendo visualizado. 
      Instruções: Use linguagem direta, verbos de ação e garanta que seja otimizado para ATS (rastreadores de currículo). Foque nas competências do candidato.
      
      Dados do Candidato:
      Nome: ${data.fullName}
      Educação: ${data.education.map(edu => `${edu.course} na ${edu.school} (${edu.period})`).join(', ')}
      Experiência: ${data.experience.map(exp => `${exp.role} na ${exp.company} - ${exp.description}`).join('; ')}
      Hard Skills: ${data.hardSkills}
      Soft Skills: ${data.softSkills}
      Cursos: ${data.courses.map(c => `${c.title} na ${c.institution} (${c.year})`).join(', ')}
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const text = response.text;
      if (text) {
        setData(prev => ({ ...prev, summary: text.trim() }));
      }
    } catch (error) {
      console.error("Erro ao gerar resumo:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSkills = async (type: 'hard' | 'soft') => {
    const courses = data.education.map(edu => edu.course).filter(c => c).join(", ");
    if (!courses) {
      alert("Por favor, preencha o campo 'Curso' na tela de Experiências Escolares primeiro.");
      return;
    }

    if (type === 'hard') setIsGeneratingHard(true);
    else setIsGeneratingSoft(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const prompt = `Pesquise sobre ${type} skills recomendadas para quem estuda ou se formou em: ${courses}. 
      Retorne uma lista com as 8 mais importantes e atuais para o mercado de trabalho brasileiro.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["skills"]
          }
        }
      });

      const result = JSON.parse(response.text);
      if (result.skills) {
        if (type === 'hard') setSuggestedHardSkills(result.skills);
        else setSuggestedSoftSkills(result.skills);
      }
    } catch (error) {
      console.error(`Erro ao gerar ${type} skills:`, error);
    } finally {
      if (type === 'hard') setIsGeneratingHard(false);
      else setIsGeneratingSoft(false);
    }
  };

  const addSkill = (type: 'hard' | 'soft', skill: string) => {
    const field = type === 'hard' ? 'hardSkills' : 'softSkills';
    const current = data[field];
    const newValue = current ? `${current}, ${skill}` : skill;
    
    // Evitar duplicatas simples
    if (current.toLowerCase().includes(skill.toLowerCase())) return;
    
    setData(prev => ({ ...prev, [field]: newValue }));
  };

  const removeSkill = (type: 'hard' | 'soft', skill: string) => {
    const field = type === 'hard' ? 'hardSkills' : 'softSkills';
    const current = data[field];
    const list = current.split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== skill.toLowerCase());
    setData(prev => ({ ...prev, [field]: list.join(', ') }));
  };

  const generateExpActivities = async (index: number) => {
    const role = data.experience[index].role;
    if (!role) {
      alert("Por favor, preencha o campo 'Cargo' primeiro.");
      return;
    }

    setIsGeneratingExp(prev => ({ ...prev, [index]: true }));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const prompt = `Pesquise no site da Classificação Brasileira de Ocupações (https://cbo.mte.gov.br/cbosite/pages/home.jsf) sobre atividades profissionais típicas para o cargo: ${role}. 
      Retorne uma lista com 6 atividades principais, curtas e em tópicos, ideais para um currículo.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              activities: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["activities"]
          }
        }
      });

      const result = JSON.parse(response.text);
      if (result.activities) {
        setSuggestedActivities(prev => ({ ...prev, [index]: result.activities }));
      }
    } catch (error) {
      console.error(`Erro ao gerar atividades para o cargo ${role}:`, error);
    } finally {
      setIsGeneratingExp(prev => ({ ...prev, [index]: false }));
    }
  };

  const addActivity = (index: number, activity: string) => {
    const current = data.experience[index].description;
    const newValue = current ? `${current}\n• ${activity}` : `• ${activity}`;
    
    handleExperienceChange(index, 'description', newValue);
  };

  const stepsData = [
    {
      title: "Vamos começar!",
      subtitle: "Dados de Contato Profissional",
      icon: <User className="text-white w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <input 
            type="text" 
            className="w-full bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
            placeholder="Nome Completo *" 
            value={data.fullName} 
            onChange={e => handleChange('fullName', e.target.value)} 
          />
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="text" 
              className="bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
              placeholder="Cidade *" 
              value={data.city} 
              onChange={e => handleChange('city', e.target.value)} 
            />
            <select 
              className="bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black"
              value={data.state}
              onChange={e => handleChange('state', e.target.value)}
            >
              <option value="">Estado (UF) *</option>
              {BRAZILIAN_STATES.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <input 
              type="text" 
              className="bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black w-full" 
              placeholder="Telefone *" 
              value={data.phone} 
              onChange={e => handleChange('phone', e.target.value)} 
            />
          </div>
          <input 
            type="email" 
            className="w-full bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
            placeholder="E-mail *" 
            value={data.email} 
            onChange={e => handleChange('email', e.target.value)} 
          />
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="text" 
              className="bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
              placeholder="LinkedIn (ex: https://linkedin.com/in/voce) *" 
              value={data.linkedin} 
              onChange={e => handleChange('linkedin', e.target.value)} 
            />
            <input 
              type="text" 
              className="bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
              placeholder="Portfólio (ex: https://github.com/voce) *" 
              value={data.portfolio} 
              onChange={e => handleChange('portfolio', e.target.value)} 
            />
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-2.5">
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>Dica 1:</strong> Se você usa Nome Social, você não tem obrigação de escrever seu nome de registro nesse espaço. Mais informações no link: <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/decreto/d8727.htm" target="_blank" rel="noopener noreferrer" className="underline font-bold">Decreto nº 8.727</a>
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>Dica 2:</strong> Não é recomendado envio de foto e colocar o endereço completo em currículos, escreva apenas o município onde você mora e estado (Ex: Presidente Prudente/SP)
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Experiências escolares",
      subtitle: "Sua formação acadêmica",
      icon: <GraduationCap className="text-white w-6 h-6" />,
      content: (
        <div className="space-y-6">
          {data.education.map((edu, index) => (
            <div key={index} className="space-y-3 p-4 bg-white/50 rounded-xl border border-brand-gray/30 relative group">
              {data.education.length > 1 && (
                <button 
                  onClick={() => removeEducation(index)}
                  className="absolute -top-2 -right-2 bg-white text-brand-red p-1 rounded-full shadow-md hover:bg-brand-red hover:text-white transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <select
                className="w-full bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black"
                value={edu.level}
                onChange={e => handleEducationChange(index, 'level', e.target.value)}
              >
                <option value="">Selecione o nível de ensino *</option>
                <option value="Ensino fundamental completo (1º a 9º ano)">Ensino fundamental completo (1º a 9º ano)</option>
                <option value="Ensino Médio ou Ensino Técnico">Ensino Médio ou Ensino Técnico</option>
                <option value="Ensino Superior (Universidade/Faculdade)">Ensino Superior (Universidade/Faculdade)</option>
              </select>
              <input 
                type="text" 
                className="w-full bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
                placeholder="Instituição (Ex: SENAI) *" 
                value={edu.school} 
                onChange={e => handleEducationChange(index, 'school', e.target.value)} 
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  className="bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
                  placeholder="Curso *" 
                  value={edu.course} 
                  onChange={e => handleEducationChange(index, 'course', e.target.value)} 
                />
                <input 
                  type="text" 
                  className="bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
                  placeholder="Período (ex: 2025 a 2026) *" 
                  value={edu.period} 
                  onChange={e => handleEducationChange(index, 'period', e.target.value)} 
                />
              </div>
            </div>
          ))}

          <button 
            onClick={addEducation}
            className="w-full py-2 border-2 border-dashed border-brand-gray rounded-xl text-brand-gray font-bold flex items-center justify-center gap-2 hover:border-brand-red hover:text-brand-red transition-colors"
          >
            <Plus size={18} /> Incluir experiência escolar
          </button>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-2.5">
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>Dica 1:</strong> Estudou no SENAI-SP? Coloque esta informação - Escola SENAI "Santo Paschoal Crepaldi" - Educação e Tecnologia.
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>Dica 2:</strong> Encontre mais informações sobre o curso no link abaixo: <a href="https://www.sp.senai.br/cursos?unidade=914" target="_blank" rel="noopener noreferrer" className="underline font-bold">Cursos SENAI Unidade 914</a>
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Hard Skills",
      subtitle: "Competências e conhecimentos técnicos",
      icon: <Zap className="text-white w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-brand-red uppercase block">Hard Skills (Habilidades Técnicas) *</label>
            </div>
            
            <input 
              type="text" 
              className="w-full bg-white border border-brand-red rounded-lg p-2.5 focus:border-brand-dark-red outline-none transition-colors text-black text-sm" 
              placeholder="Ex: Excel Avançado, AutoCAD, Manutenção Elétrica, Python, Power BI... *" 
              value={data.hardSkills} 
              onChange={e => handleChange('hardSkills', e.target.value)} 
            />

            {/* Badges de Hard Skills já adicionadas */}
            {data.hardSkills && (
              <div className="pt-1">
                <span className="text-[11px] font-bold text-black uppercase block mb-1.5">Hard Skills selecionadas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.hardSkills.split(',').map((s, idx) => {
                    const skill = s.trim();
                    if (!skill) return null;
                    return (
                      <span key={idx} className="bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill('hard', skill)}
                          className="hover:text-black font-bold text-sm leading-none ml-0.5"
                          title="Remover"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sugestões da IA */}
            {suggestedHardSkills.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-bold text-brand-gray uppercase mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} className="text-brand-red" /> Sugestões da IA para sua área:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedHardSkills.map((skill, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addSkill('hard', skill)}
                      className="text-xs bg-white text-gray-700 px-2.5 py-1 rounded-lg hover:bg-brand-red hover:text-white transition-colors border border-brand-gray/30 font-medium"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sugestões Comuns de Hard Skills */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-brand-gray uppercase mb-1.5">Sugestões comuns recomendadas:</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_HARD_SKILLS.map((skill, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addSkill('hard', skill)}
                    className="text-xs bg-brand-gray/5 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-brand-red hover:text-white transition-colors border border-brand-gray/20 font-medium"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>O que são Hard Skills?</strong> São as competências técnicas e conhecimentos práticos que você aprendeu em cursos técnicos (como no SENAI), escola, graduação ou no dia a dia profissional. Exemplos: operação de máquinas, softwares (Excel, Power BI, AutoCAD), soldagem, manutenção, programação, rotinas contábeis, etc.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Soft Skills",
      subtitle: "Habilidades comportamentais e humanas",
      icon: <Sparkles className="text-white w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-brand-dark-red uppercase block">Soft Skills (Habilidades Comportamentais) *</label>
            </div>

            <input 
              type="text" 
              className="w-full bg-white border border-brand-dark-red rounded-lg p-2.5 focus:border-brand-deep-red outline-none transition-colors text-black text-sm" 
              placeholder="Ex: Trabalho em equipe, Comunicação eficaz, Proatividade, Pontualidade... *" 
              value={data.softSkills} 
              onChange={e => handleChange('softSkills', e.target.value)} 
            />

            {/* Badges de Soft Skills já adicionadas */}
            {data.softSkills && (
              <div className="pt-1">
                <span className="text-[11px] font-bold text-black uppercase block mb-1.5">Soft Skills selecionadas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.softSkills.split(',').map((s, idx) => {
                    const skill = s.trim();
                    if (!skill) return null;
                    return (
                      <span key={idx} className="bg-brand-dark-red/10 border border-brand-dark-red/30 text-brand-dark-red text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill('soft', skill)}
                          className="hover:text-black font-bold text-sm leading-none ml-0.5"
                          title="Remover"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sugestões da IA */}
            {suggestedSoftSkills.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-bold text-brand-gray uppercase mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} className="text-brand-dark-red" /> Sugestões da IA para sua área:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedSoftSkills.map((skill, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addSkill('soft', skill)}
                      className="text-xs bg-white text-gray-700 px-2.5 py-1 rounded-lg hover:bg-brand-dark-red hover:text-white transition-colors border border-brand-gray/30 font-medium"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sugestões Comuns de Soft Skills */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-brand-gray uppercase mb-1.5">Sugestões comuns recomendadas:</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SOFT_SKILLS.map((skill, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addSkill('soft', skill)}
                    className="text-xs bg-brand-gray/5 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-brand-dark-red hover:text-white transition-colors border border-brand-gray/20 font-medium"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>O que são Soft Skills?</strong> São as suas atitudes comportamentais, inteligência emocional e capacidade de relacionamento humano no trabalho. Mostram como você se comunica, resolve problemas sob pressão, colabora em grupo e lidera iniciativas.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Experiências de trabalho",
      subtitle: "Empresas ou Projetos Reais",
      icon: <Briefcase className="text-white w-6 h-6" />,
      content: (
        <div className="space-y-6">
          {data.experience.map((exp, index) => (
            <div key={index} className="space-y-3 p-4 bg-white/50 rounded-xl border border-brand-gray/30 relative group">
              {data.experience.length > 1 && (
                <button 
                  onClick={() => removeExperience(index)}
                  className="absolute -top-2 -right-2 bg-white text-brand-red p-1 rounded-full shadow-md hover:bg-brand-red hover:text-white transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <input 
                type="text" 
                className="w-full bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
                placeholder="Empresa/Projeto *" 
                value={exp.company} 
                onChange={e => handleExperienceChange(index, 'company', e.target.value)} 
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  className="w-full bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
                  placeholder="Cargo *" 
                  value={exp.role} 
                  onChange={e => handleExperienceChange(index, 'role', e.target.value)} 
                />
                <input 
                  type="text" 
                  className="w-full bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black" 
                  placeholder="Período *" 
                  value={exp.period} 
                  onChange={e => handleExperienceChange(index, 'period', e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-brand-gray uppercase">O que você realizou? *</label>
                </div>
                <textarea 
                  className="w-full h-32 bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors resize-none text-black text-sm" 
                  placeholder="Descreva suas atividades... *" 
                  value={exp.description} 
                  onChange={e => handleExperienceChange(index, 'description', e.target.value)} 
                />
                {suggestedActivities[index] && (
                  <div className="space-y-1 mt-2">
                    <p className="text-[10px] font-bold text-brand-gray uppercase">Sugestões CBO (clique para adicionar):</p>
                    <div className="flex flex-col gap-1">
                      {suggestedActivities[index].map((activity, i) => (
                        <button
                          key={i}
                          onClick={() => addActivity(index, activity)}
                          className="text-left text-[10px] bg-white border border-brand-gray/20 p-2 rounded-md hover:bg-brand-red/5 hover:border-brand-red/30 transition-all text-brand-gray"
                        >
                          + {activity}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <button 
            onClick={addExperience}
            className="w-full py-2 border-2 border-dashed border-brand-gray rounded-xl text-brand-gray font-bold flex items-center justify-center gap-2 hover:border-brand-red hover:text-brand-red transition-colors"
          >
            <Plus size={18} /> Incluir experiência de trabalho
          </button>

          <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-2.5">
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>EMPREGO FORMAL:</strong> Com carteira assinada (CLT), contrato de trabalho assinado, contrato de estágio, jovem aprendiz, etc.
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>EMPREGO INFORMAL:</strong> Trabalhos feitos sem contratos firmados, autônomo, freelancer, "bicos", "trampos", etc.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Eventos que participei",
      subtitle: "Cursos extras e certificados",
      icon: <Trophy className="text-white w-6 h-6" />,
      content: (
        <div className="space-y-6">
          {data.courses.map((item, idx) => (
            <div key={idx} className="p-4 bg-white border border-brand-red rounded-xl space-y-3 relative group">
              {data.courses.length > 1 && (
                <button 
                  onClick={() => removeEvent(idx)}
                  className="absolute -top-2 -right-2 bg-white border border-brand-red text-brand-red p-1 rounded-full hover:bg-brand-red hover:text-white transition-colors shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-gray uppercase">Instituição do evento *</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-brand-gray/30 rounded p-2 focus:border-brand-red outline-none transition-colors text-black text-sm" 
                    placeholder="Ex: SENAI, Google, Udemy *" 
                    value={item.institution} 
                    onChange={e => handleEventChange(idx, 'institution', e.target.value)} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-gray uppercase">Título do evento *</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-brand-gray/30 rounded p-2 focus:border-brand-red outline-none transition-colors text-black text-sm" 
                    placeholder="Ex: Workshop de React *" 
                    value={item.title} 
                    onChange={e => handleEventChange(idx, 'title', e.target.value)} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-gray uppercase">Ano que aconteceu *</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-brand-gray/30 rounded p-2 focus:border-brand-red outline-none transition-colors text-black text-sm" 
                    placeholder="Ex: 2023 *" 
                    value={item.year} 
                    onChange={e => handleEventChange(idx, 'year', e.target.value)} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-gray uppercase">Duração em horas *</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-brand-gray/30 rounded p-2 focus:border-brand-red outline-none transition-colors text-black text-sm" 
                    placeholder="Ex: 40h *" 
                    value={item.duration} 
                    onChange={e => handleEventChange(idx, 'duration', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addEvent}
            className="w-full py-2 border-2 border-dashed border-brand-gray rounded-xl text-brand-gray font-bold flex items-center justify-center gap-2 hover:border-brand-red hover:text-brand-red transition-colors"
          >
            <Plus size={18} /> Incluir outro evento/curso
          </button>
        </div>
      )
    },
    {
      title: "Habilitação (CNH)",
      subtitle: "Informações sobre condução de veículos",
      icon: <Car className="text-white w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold text-black block mb-2 uppercase">Você possui carteira de motorista (CNH)? *</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleChange('driverLicense', 'Não tenho habilitação')}
                className={`text-left p-3 rounded-lg border transition-all group ${data.driverLicense === 'Não tenho habilitação' ? 'border-brand-red bg-brand-red/5' : 'border-brand-gray/30 hover:border-brand-red hover:bg-brand-red/5'}`}
              >
                <div className="font-bold text-brand-red group-hover:text-brand-dark-red">Não tenho habilitação</div>
                <div className="text-[10px] text-brand-gray leading-tight">Selecione esta opção caso não possua CNH.</div>
              </button>

              {[
                { cat: 'A', desc: 'Veículos motorizados de duas ou três rodas, como motos, motonetas e triciclos.' },
                { cat: 'B', desc: 'Veículos motorizados de quatro rodas, com peso bruto total de até 3.500 kg e lotação máxima de oito passageiros (ex: carros, picapes, SUVs, vans pequenas).' },
                { cat: 'C', desc: 'Veículos de carga, como caminhões, caminhonetes e vans de carga, com peso superior a 3.500 kg.' },
                { cat: 'D', desc: 'Veículos de transporte de passageiros com mais de oito lugares, como ônibus, micro-ônibus e vans de passageiros.' },
                { cat: 'E', desc: 'Combinações de veículos em que a unidade tratora se enquadra nas categorias B, C ou D, e a unidade acoplada (reboque, semirreboque) tenha 6.000 kg ou mais de PBT, ou transporte passageiros (ex: carretas, bitrens).' }
              ].map((item) => (
                <button
                  key={item.cat}
                  onClick={() => {
                    let current = data.driverLicense ? data.driverLicense.split(', ') : [];
                    // If it was "Não tenho habilitação", clear it first
                    if (current.includes('Não tenho habilitação')) {
                      current = [];
                    }
                    if (!current.includes(`Categoria ${item.cat}`)) {
                      handleChange('driverLicense', [...current, `Categoria ${item.cat}`].join(', '));
                    }
                  }}
                  className="text-left p-3 rounded-lg border border-brand-gray/30 hover:border-brand-red hover:bg-brand-red/5 transition-all group"
                >
                  <div className="font-bold text-brand-red group-hover:text-brand-dark-red">Categoria {item.cat}</div>
                  <div className="text-[10px] text-brand-gray leading-tight">{item.desc}</div>
                </button>
              ))}
            </div>
            {data.driverLicense && (
              <div className="mt-2 p-2 bg-brand-red/5 rounded border border-brand-red/20 flex justify-between items-center">
                <span className="text-xs font-medium text-brand-red">Selecionado: {data.driverLicense}</span>
                <button onClick={() => handleChange('driverLicense', '')} className="text-[10px] text-brand-red underline">Limpar</button>
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
            <p className="leading-relaxed">
              <strong>Por que informar a CNH?</strong> Diversas vagas exigem disponibilidade para locomoção, viagens ou trabalho externo. Indicar suas categorias demonstra prontidão profissional.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Idiomas",
      subtitle: "Línguas e nível de proficiência",
      icon: <Languages className="text-white w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-black block uppercase">Selecione ou adicione idiomas *</label>
            
            {/* Sugestões rápidas */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-brand-gray uppercase">Opções rápidas recomendadas:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Português (Nativo)",
                  "Inglês (Básico)",
                  "Inglês (Intermediário)",
                  "Inglês (Avançado)",
                  "Inglês (Fluente)",
                  "Espanhol (Básico)",
                  "Espanhol (Intermediário)",
                  "Espanhol (Avançado)",
                  "Libras (Básico)",
                  "Libras (Intermediário)",
                  "Francês (Básico)",
                  "Italiano (Básico)",
                  "Alemão (Básico)",
                  "Japonês (Básico)"
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      const current = data.languages ? data.languages.split(', ') : [];
                      if (!current.includes(item)) {
                        handleChange('languages', [...current, item].join(', '));
                      }
                    }}
                    className="text-xs bg-white border border-brand-gray/40 hover:border-brand-red hover:text-brand-red hover:bg-brand-red/5 px-2.5 py-1.5 rounded-lg transition-all text-gray-700 font-medium"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu seletor */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-brand-gray uppercase block mb-1.5">Ou selecione na lista:</label>
              <select 
                className="w-full bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    const current = data.languages ? data.languages.split(', ') : [];
                    if (!current.includes(e.target.value)) {
                      handleChange('languages', [...current, e.target.value].join(', '));
                    }
                    e.target.value = "";
                  }
                }}
              >
                <option value="">Selecione um idioma e nível *</option>
                <option value="Português (Nativo)">Português (Nativo)</option>
                <option value="Inglês (Básico)">Inglês (Básico)</option>
                <option value="Inglês (Intermediário)">Inglês (Intermediário)</option>
                <option value="Inglês (Avançado)">Inglês (Avançado)</option>
                <option value="Inglês (Fluente)">Inglês (Fluente)</option>
                <option value="Espanhol (Básico)">Espanhol (Básico)</option>
                <option value="Espanhol (Intermediário)">Espanhol (Intermediário)</option>
                <option value="Espanhol (Avançado)">Espanhol (Avançado)</option>
                <option value="Libras (Básico)">Libras (Língua Brasileira de Sinais - Básico)</option>
                <option value="Libras (Intermediário)">Libras (Língua Brasileira de Sinais - Intermediário)</option>
                <option value="Francês (Básico)">Francês (Básico)</option>
                <option value="Francês (Intermediário)">Francês (Intermediário)</option>
                <option value="Italiano (Básico)">Italiano (Básico)</option>
                <option value="Italiano (Intermediário)">Italiano (Intermediário)</option>
                <option value="Alemão (Básico)">Alemão (Básico)</option>
                <option value="Japonês (Básico)">Japonês (Básico)</option>
                <option value="Mandarim (Básico)">Mandarim (Básico)</option>
              </select>
            </div>

            {/* Inserção livre */}
            <div className="pt-1">
              <label className="text-[11px] font-bold text-brand-gray uppercase block mb-1.5">Adicionar outro idioma manualmente:</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 bg-white border border-brand-gray rounded p-2 focus:border-brand-red outline-none transition-colors text-black text-sm" 
                  placeholder="Ex: Mandarim (Básico), Russo (Iniciante)... *" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        const current = data.languages ? data.languages.split(', ') : [];
                        if (!current.includes(val)) {
                          handleChange('languages', [...current, val].join(', '));
                        }
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousSibling as HTMLInputElement);
                    const val = input.value.trim();
                    if (val) {
                      const current = data.languages ? data.languages.split(', ') : [];
                      if (!current.includes(val)) {
                        handleChange('languages', [...current, val].join(', '));
                      }
                      input.value = "";
                    }
                  }}
                  className="bg-brand-red hover:bg-brand-dark-red text-white px-4 rounded font-bold text-xs transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Idiomas adicionados */}
            <div className="pt-2">
              <span className="text-xs font-bold text-black uppercase block mb-2">Idiomas que constarão no currículo:</span>
              {data.languages ? (
                <div className="flex flex-wrap gap-2">
                  {data.languages.split(', ').map((lang, i) => (
                    <span key={i} className="bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs px-3 py-1.5 rounded-full flex items-center gap-2 font-medium shadow-sm">
                      {lang}
                      <button 
                        type="button"
                        onClick={() => {
                          const filtered = data.languages.split(', ').filter(l => l !== lang).join(', ');
                          handleChange('languages', filtered);
                        }} 
                        className="hover:text-black font-bold text-sm leading-none ml-1"
                        title="Remover idioma"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brand-gray italic bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  Nenhum idioma selecionado ainda. Clique nas opções rápidas acima, selecione na lista ou digite manualmente.
                </p>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs mt-4">
              <p className="leading-relaxed">
                <strong>Dica de ouro:</strong> Se você só domina o português, adicione <em>"Português (Nativo)"</em>. Se conhece a <strong>Libras (Língua Brasileira de Sinais)</strong>, não deixe de registrar, pois é um excelente diferencial de inclusão valorizado pelas empresas!
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Fale um pouco sobre você",
      subtitle: "O que você faz e qual seu objetivo?",
      icon: <ScrollText className="text-white w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-black uppercase">Resumo Profissional *</label>
          </div>
          <textarea 
            className="w-full h-36 bg-white border border-brand-red rounded p-3 focus:border-brand-dark-red outline-none transition-colors resize-none text-black text-sm" 
            placeholder="Ex: Estudante de TI com foco em desenvolvimento web. Busco minha primeira oportunidade... *" 
            value={data.summary} 
            onChange={e => handleChange('summary', e.target.value)} 
          />

          {/* Quadro azul com Dica de Prompt para IA Generativa */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-2.5">
            <div className="space-y-1">
              <p className="font-bold text-xs text-blue-950 uppercase tracking-wide">Dica:</p>
              <p className="text-xs text-blue-900 leading-relaxed">
                Você pode usar a IA Generativa para fazer sua mini bio. Use a PROMPT abaixo:
              </p>
            </div>

            <div className="bg-white/95 border border-blue-300 rounded-lg p-3 text-xs font-mono text-blue-950 leading-relaxed select-all relative group shadow-xs">
              <p className="pr-16 font-medium">
                ANALISE ESTE CURRÍCULO COMO SE VOCÊ FOSSE UM RECRUTADOR DE UMA EMPRESA DE [ÁREA DA EMPRESA] PARA ESCOLHER UM CANDIDATO PARA A VAGA DE [NOME DA VAGA]. ADICIONE DICAS PARA MELHORAR O CURRÍCULO E ACRESCENTE MAIS PALAVRAS-CHAVE NA MINI BIO E SEÇÃO DE COMPETÊNCIAS.
              </p>
              <button
                type="button"
                onClick={() => {
                  const promptText = "ANALISE ESTE CURRÍCULO COMO SE VOCÊ FOSSE UM RECRUTADOR DE UMA EMPRESA DE [ÁREA DA EMPRESA] PARA ESCOLHER UM CANDIDATO PARA A VAGA DE [NOME DA VAGA]. ADICIONE DICAS PARA MELHORAR O CURRÍCULO E ACRESCENTE MAIS PALAVRAS-CHAVE NA MINI BIO E SEÇÃO DE COMPETÊNCIAS.";
                  navigator.clipboard.writeText(promptText);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2500);
                }}
                className="absolute top-2.5 right-2.5 bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-sans font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors border border-blue-300"
                title="Copiar prompt"
              >
                {copiedPrompt ? (
                  <>
                    <Check size={12} className="text-green-600" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Turbinamos seu currículo!",
      subtitle: "Quase lá! Falta pouco",
      icon: <CheckCircle className="text-white w-6 h-6" />,
      content: (
        <div className="flex flex-col gap-6 items-center justify-center h-full py-4 text-center">
          <p className="text-sm font-medium text-black leading-relaxed">
            Agora que seu currículo está turbinado, envie para a Biblio SENAI-SP 9.14 para darmos os últimos retoques.
          </p>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadDOC} 
            className="w-full max-w-xs bg-white border-2 border-brand-red text-brand-red hover:bg-brand-red/5 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Download size={18} /> BAIXAR O EDITÁVEL (.DOC)
          </motion.button>

          <div className="w-full max-w-xs h-px bg-brand-gray/20 my-2"></div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendToLibrary}
            className="w-full max-w-xs bg-brand-red hover:bg-brand-dark-red text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-red/20"
          >
            <Send size={20} /> Envie este currículo para a Biblioteca!
          </motion.button>
          
          <div className="text-[11px] text-brand-gray text-left bg-brand-gray/5 p-3 rounded-lg border border-brand-gray/10">
            <p className="font-bold mb-1">Instruções:</p>
            <p>1 - Baixe o documento para seu dispositivo;</p>
            <p>2 - Envie por e-mail no botão acima;</p>
            <p>3 - Anexe o documento baixado;</p>
            <p>4 - Após envio, aguarde a devolutiva da nossa equipe com a formatação final.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Painel Esquerdo: Interface Game */}
      <div className="w-full lg:w-2/5 p-6 bg-white border-r border-brand-gray flex flex-col shadow-2xl z-10">
        <header className="mb-8">
          <h1 className="font-bold text-brand-red text-xl flex items-center gap-2">
            <Zap className="fill-brand-red text-brand-red" size={20} />
            TURBINE O SEU CURRÍCULO COM A BIBLIOTECA SENAI-SP 9.14!
          </h1>
          <div className="mt-6 w-full bg-brand-gray h-3 rounded-full overflow-hidden border border-brand-gray">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xp}%` }}
              className="bg-brand-red h-full shadow-[0_0_10px_rgba(227,6,19,0.5)]"
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] uppercase font-bold text-brand-gray tracking-widest">
            <span>Progresso: {xp}%</span>
            <span>Nível {step + 1}</span>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button 
              onClick={() => setStep(s => s - 1)} 
              disabled={step === 0} 
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'bg-brand-gray hover:bg-brand-gray/80 text-white'}`}
            >
              Voltar
            </button>
            
            <div className="flex gap-1.5">
              {stepsData.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === step ? 'bg-brand-red w-3' : 'bg-brand-gray/30'}`} />
              ))}
            </div>

            {step < maxSteps ? (
              <button 
                onClick={() => setStep(s => s + 1)} 
                className="bg-brand-red hover:bg-brand-dark-red text-white px-6 py-2 rounded-lg font-bold text-xs shadow-lg shadow-brand-red/20 transition-all transform hover:scale-105 active:scale-95"
              >
                Próximo
              </button>
            ) : (
              <div className="w-[80px]" />
            )}
          </div>
        </header>

        <main className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-brand-gray/10 border border-brand-gray p-6 rounded-2xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-brand-red rounded-xl shadow-lg shadow-brand-red/40">
                  {stepsData[step].icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-black">{stepsData[step].title}</h2>
                  <p className="text-brand-gray text-sm">{stepsData[step].subtitle}</p>
                </div>
              </div>

              {step < stepsData.length - 1 && (
                <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2 shadow-sm">
                  <span className="text-brand-red font-bold text-sm leading-none mt-0.5">*</span>
                  <p className="leading-relaxed font-medium">
                    Preencha todos os campos, é importante ter as informações completas para se ter um currículo profissional mais adequado e padronizado.
                  </p>
                </div>
              )}

              {stepsData[step].content}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mt-8 pt-6 border-t border-brand-gray/20 text-[10px] text-brand-gray text-center leading-relaxed">
          Este é um aplicativo experimental do Google AI Studio em versão beta para o Projeto Engrenagens - 'Turbine meu currículo!' desenvolvido pela Biblioteca da Escola SENAI-SP 9.14 Presidente Prudente / contato: <a href="mailto:morgan.morgado@sp.senai.br" className="underline font-medium hover:text-brand-red">morgan.morgado@sp.senai.br</a>. Melhor visualizado em monitores desktop. 2023 - 2026.
        </footer>
      </div>

      {/* Painel Direito: Preview do Papel */}
      <div ref={previewContainerRef} className="w-full lg:w-3/5 bg-brand-gray/20 p-4 lg:p-10 overflow-y-auto flex justify-center items-start">
        <div className="sticky top-10">
          <div 
            id="resume-preview" 
            className="resume-paper shadow-2xl origin-top transition-transform"
            style={{ transform: `scale(${previewScale})` }}
          >
            <header className="page-break-avoid">
              <h1>{data.fullName || "SEU NOME COMPLETO"}</h1>
              <div className="contact-info">
                {(data.city || data.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={10} /> {data.city}{data.city && data.state ? ' - ' : ''}{data.state}
                  </span>
                )}
                {data.phone && <span className="flex items-center gap-1"><Phone size={10} /> {data.phone}</span>}
                {data.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={10} /> 
                    <a href={`mailto:${data.email}`} className="hover:underline">{data.email}</a>
                  </span>
                )}
                {data.linkedin && (
                  <span className="flex items-center gap-1">
                    <LinkIcon size={10} /> 
                    <a href={data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {data.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </span>
                )}
                {data.portfolio && (
                  <span className="flex items-center gap-1">
                    <Monitor size={10} /> 
                    <a href={data.portfolio.startsWith('http') ? data.portfolio : `https://${data.portfolio}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {data.portfolio.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </span>
                )}
              </div>
            </header>

            {data.summary && (
              <section className="page-break-avoid">
                <h2>RESUMO PROFISSIONAL</h2>
                <p>{data.summary}</p>
              </section>
            )}

            {data.education.some(edu => edu.school) && (
              <section className="page-break-avoid">
                <h2>FORMAÇÃO ACADÊMICA</h2>
                {data.education.map((edu, idx) => edu.school && (
                  <div key={idx} className={idx > 0 ? "mt-3" : ""}>
                    <h3>{edu.school}</h3>
                    <p>{edu.course} | {edu.period}</p>
                  </div>
                ))}
              </section>
            )}

            {(data.hardSkills || data.softSkills || data.driverLicense || data.languages) && (
              <section className="page-break-avoid">
                <h2>COMPETÊNCIAS E INFORMAÇÕES</h2>
                {data.hardSkills && <p><strong>Técnicas:</strong> {data.hardSkills}</p>}
                {data.softSkills && <p><strong>Comportamentais:</strong> {data.softSkills}</p>}
                {data.driverLicense && data.driverLicense !== 'Não tenho habilitação' && <p><strong>Habilitação:</strong> {data.driverLicense}</p>}
                {data.languages && <p><strong>Idiomas:</strong> {data.languages}</p>}
              </section>
            )}

            {data.experience.some(exp => exp.company) && (
              <section className="page-break-avoid">
                <h2>EXPERIÊNCIA PROFISSIONAL</h2>
                {data.experience.map((exp, idx) => exp.company && (
                  <div key={idx} className={idx > 0 ? "mt-4" : ""}>
                    <h3>{exp.company}</h3>
                    <p className="italic">{exp.role} | {exp.period}</p>
                    <p className="whitespace-pre-line">{exp.description}</p>
                  </div>
                ))}
              </section>
            )}

            {data.courses.some(c => c.title) && (
              <section className="page-break-avoid">
                <h2>CURSOS E COMPLEMENTOS</h2>
                {data.courses.map((course, idx) => course.title && (
                  <div key={idx} className={idx > 0 ? "mt-3" : ""}>
                    <h3>{course.title}</h3>
                    <p>{course.institution} | {course.year} {course.duration && `(${course.duration})`}</p>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
