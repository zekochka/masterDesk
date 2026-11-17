#!/usr/bin/env python3
"""Regenerate the Word report from actual results + documented budget assumptions.
Never fills unrun Qwen metrics with fictitious numbers.
"""
from pathlib import Path
import json,csv
from docx import Document
from docx.shared import Inches,Pt,RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT,WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/ai/LZ12_REPORT.docx'
DATA=ROOT/'evals/results'


def summary(name):
 p=DATA/f'{name}_summary.json'
 return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None


def tab(doc,columns,rows,widths=None):
 t=doc.add_table(rows=1,cols=len(columns));t.style='Table Grid';t.alignment=WD_TABLE_ALIGNMENT.CENTER
 for i,c in enumerate(columns):
  cell=t.rows[0].cells[i]; cell.text=str(c);cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
  tcPr=cell._tc.get_or_add_tcPr();shd=OxmlElement('w:shd');shd.set(qn('w:fill'),'E9EFF6');tcPr.append(shd)
  for r in cell.paragraphs[0].runs:r.bold=True
 for row in rows:
  for c,v in zip(t.add_row().cells,row):
   c.text=str(v);c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
 for row in t.rows:
  for cell in row.cells:
   for p in cell.paragraphs:
    p.paragraph_format.space_before=Pt(1)
    p.paragraph_format.space_after=Pt(1)
    for run in p.runs:
     run.font.name='Times New Roman';run.font.size=Pt(9)
 if widths:
  for row in t.rows:
   for c,w in zip(row.cells,widths):c.width=Inches(w)
 doc.add_paragraph()
 return t


def add_p(doc,text='',bold_lead=None,style=None):
 p=doc.add_paragraph(style=style)
 if bold_lead and text.startswith(bold_lead):
  p.add_run(bold_lead).bold=True;p.add_run(text[len(bold_lead):])
 else:p.add_run(text)
 return p


def make():
 baseline=summary('baseline'); q0=summary('qwen_zeroshot'); q1=summary('qwen_fewshot')
 cost_file=DATA/'cost_estimate.json';cost=json.loads(cost_file.read_text(encoding='utf-8'))
 doc=Document()
 sec=doc.sections[0]
 sec.top_margin=Inches(.8);sec.bottom_margin=Inches(.72)
 sec.left_margin=Inches(.85);sec.right_margin=Inches(.85)
 styles=doc.styles
 normal=styles['Normal'];normal.font.name='Times New Roman';normal.font.size=Pt(10.5);normal.font.color.rgb=RGBColor(35,42,54)
 normal.paragraph_format.space_after=Pt(5)
 for key,size in [('Title',17),('Heading 1',13),('Heading 2',11)]:
  s=styles[key];s.font.name='Times New Roman';s.font.size=Pt(size);s.font.color.rgb=RGBColor(27,58,94);s.font.bold=True
 styles['Title'].paragraph_format.space_after=Pt(7)
 header=sec.header.paragraphs[0];header.alignment=WD_ALIGN_PARAGRAPH.RIGHT
 rr=header.add_run('MASTERDESK  /  TECHPOINT  /  ЛЗ-12');rr.font.size=Pt(8);rr.font.color.rgb=RGBColor(115,125,136)
 p=doc.add_paragraph(style='Title');p.add_run('MasterDesk — №12 зертханалық жұмыс')
 sub=doc.add_paragraph();sub.alignment=WD_ALIGN_PARAGRAPH.CENTER
 r=sub.add_run('AI функциясының жоспары, evals, шығын және тәуекелдер');r.bold=True;r.font.size=Pt(12)
 tab(doc,['Дерек','Мән'],[
 ['Пән','IT-жобаларды басқару'],['Жоба / тапсырыс беруші','MasterDesk / TechPoint'],
 ['Команда','Амир — PM, Angular; Ханкелді — .NET, PostgreSQL'],
 ['Дайындалған күні','17.11.2026'],
 ['Нәтиженің күйі','Baseline өлшенген. Qwen жергілікті прогоннан кейін толтырылады.' if not(q0 and q1) else 'Baseline және Qwen сапасы нақты өлшенген; шешім қайта қарауға дайын.'],
 ])
 doc.add_heading('1. Мақсат және таңдалған AI функциясы',1)
 add_p(doc,'Мақсат: сервис орталығында клиент хабарламасы бойынша жөндеу өтінімін құруды жеңілдететін AI ұсыныс механизмін бағалау. Ұсынылатын функция — «Ақылды өтінім құрастыру»: еркін мәтіннен құрылғы моделін (device_model), ақау санатын (category) және айтылған оқиғаны (incident) анықтау.')
 add_p(doc,'Мысалы: «Айфон 13 про упал, экран чёрный» → iPhone 13 Pro / DISPLAY / DROP. Бұл — тек операторға берілетін ұсыныс; ақаудың дәл диагнозы емес. AI тапсырысты автоматты түрде сақтамайды және шебер тағайындамайды.')
 tab(doc,['Өріс','Ықтимал мәндер'],[
 ['device_model','Мәтіндегі модель, жоқ болса UNKNOWN'],
 ['category','DISPLAY / CHARGING / BATTERY / POWER / OVERHEATING / AUDIO / SOFTWARE / OTHER'],
 ['incident','DROP — құлау; LIQUID — сұйықтық; NONE — мәтінде көрсетілмеген'],
 ])
 doc.add_heading('2. Іскерлік және техникалық өлшемдер',1)
 tab(doc,['Өлшем','Критерий / мағынасы'],[
 ['Бизнес-метрика','Оператордың өтінімді толтыру уақыты: жоспар бойынша ≥25% қысқаруы тиіс (әзірге өлшенген жоқ).'],
 ['Category Accuracy','Кемінде 0.85.'],
 ['Macro F1','Кемінде 0.85 және baseline-нан ≥0.05 жоғары.'],
 ['Device / Incident accuracy','Әрқайсысы кемінде 0.95.'],
 ['Адам бақылауы','AI ұсынған барлық мән оператор растағаннан кейін ғана сақталады.'],
 ])
 add_p(doc,'Көрсетілген шектер — зертханалық пилот үшін алдын ала белгіленген критерийлер; TechPoint оларды ресми мақұлдаған жоқ.')
 doc.add_heading('3. Тест деректері және салыстыру дизайны',1)
 add_p(doc,'evals/dataset.jsonl файлына 40 синтетикалық жөндеу өтінімі енгізілді: 8 санаттың әрқайсысында 5 жазба бар. Қазақша-орысша аралас, қысқартылған және жанама айтылған симптомдар қамтылды. Әр жағдай үшін эталон үш өріс берілген.')
 add_p(doc,'Эталондар файл ішінде алдын ала жазылған, Qwen жауабынан алынған жоқ. Бұл TechPoint-тың нақты өтінімдері емес. Екі қатысушының тәуелсіз қайта тексеруі әлі расталмаған: оны жасалды деп көрсетпейміз.')
 add_p(doc,'Бір дерек жиынында үш тәсіл өлшенеді: (1) Python-дағы кілтсөз/regex baseline, (2) Qwen zero-shot, (3) Qwen few-shot. Prompt температурасы — 0, seed — 42; әр сұраудың raw жауабы және уақыт/токен ақпараттары файлға сақталады.')
 doc.add_heading('4. AI-сыз базалық алгоритм — нақты нәтиже',1)
 add_p(doc,'Python скрипті 28 категориялық сөз ережесін және құрылғы моделін тануға арналған 22 regex үлгісін қолданады. Ешқандай ML моделі үйретілген жоқ. Сынақ осы пакеттегі dataset.jsonl үстінде орындалды.')
 tab(doc,['Метрика','Нақты мән'],[
 ['Тест саны',str(baseline['count'])],
 ['Category Accuracy',f'{baseline["category_accuracy"]:.1%} ({baseline["count"]-baseline["errors_count"]}/{baseline["count"]})'],
 ['Category Macro F1',f'{baseline["macro_f1"]:.4f}'],
 ['Device exact match',f'{baseline["device_accuracy"]:.1%}'],
 ['Incident exact match',f'{baseline["incident_accuracy"]:.1%}'],
 ['Үш өрістің барлығы дұрыс',f'{baseline["all_fields_accuracy"]:.1%}'],
 ['Категория қатесі',str(baseline['errors_count'])],
 ])
 classes=[('Дисплей','DISPLAY'),('Зарядтау','CHARGING'),('Батарея','BATTERY'),('Қосылмау','POWER'),('Қызу','OVERHEATING'),('Дыбыс','AUDIO'),('Бағдарлама','SOFTWARE'),('Өзге','OTHER')]
 tab(doc,['Санат','F1','Дұрысы / саны (Recall)'],[(label,f'{baseline["per_class"][k]["f1"]:.3f}',f'{round(baseline["per_class"][k]["recall"]*5):d}/5') for label,k in classes])
 add_p(doc,'Негізгі мәселе: жанама сөйлемдегі сөздер («сурет жоқ», «пайыз тұр», «апдейттен кейін лагает») ережелерде жоқ кезде санат OTHER болып шығады. Нақты қате мысалдары RESULTS_COMPARISON.md және CSV ішінде жазылған.')
 doc.add_heading('5. Qwen + Ollama сынағы',1)
 add_p(doc,'Қолданылатын модель: qwen2.5:3b (балама: qwen2.5:7b). Prompt нұсқалары: zero-shot (тек ереже), few-shot (басқа төрт демонстрациялық мысал бар); температура 0, seed 42, жауап тек JSON ретінде сұралады.')
 comp=[]
 for name,st in [('Baseline',baseline),('Qwen zero-shot',q0),('Qwen few-shot',q1)]:
  if st:comp.append((name,f'{st["category_accuracy"]:.1%}',f'{st["macro_f1"]:.4f}',f'{st["device_accuracy"]:.1%}',f'{st["incident_accuracy"]:.1%}',str(st.get('model','—'))))
  else:comp.append((name,'ІСКЕ ҚОСЫЛМАҒАН','—','—','—','—'))
 tab(doc,['Әдіс','Category','Macro F1','Device','Incident','Модель'],comp)
 if not(q0 and q1):
  add_p(doc,'Qwen жергілікті компьютерде әлі іске қосылмаған. Сондықтан AI дәлдігі, қателері және жауап беру уақыты туралы ешбір жалған сан берілмеді. Жіберілген код іске қосылған соң qwen_zeroshot_* және qwen_fewshot_* файлдарын автоматты түрде жазады.')
 else:
  for key,st in [('Zero-shot',q0),('Few-shot',q1)]:
   if st:add_p(doc,f'{key}: модель {st.get("model","—")}, prompt_eval_count орташа {st.get("avg_input_tokens_ollama","—")} токен, eval_count орташа {st.get("avg_output_tokens_ollama","—")} токен, орташа кідіріс {st.get("avg_latency_seconds","—")} секунд; қатесі бар сұраулар саны {st.get("request_errors",0)}.')
 add_p(doc,'Qwen іске қосу: 1) `ollama pull qwen2.5:3b`; 2) `py -m pip install -r requirements.txt`; 3) `py scripts/run_evals.py --mode qwen`; 4) `py scripts/analyze_results.py`; 5) `py scripts/build_word_report.py`. Нәтиже әрбір өтінімге сақталады.')
 doc.add_heading('6. AI пайдаланудың қаржылық болжамы',1)
 add_p(doc,'Сұраныс ағыны — айына 260 өтінім (ЛЗ-3 бойынша оқу допущениесі), 10× өсу — 2600 өтінім. Токен болжамы: бір сұрауға 900 кіріс және 80 шығыс токені. Бұл мәндер әлі нақты өлшенбеген; кейін tiktoken және Qwen prompt_eval_count арқылы нақтыланады.')
 add_p(doc,'Коммерциялық салыстыру үшін GPT-6 Luna Standard API тарифі пайдаланылды: $0.10 / 1 млн кіріс токені және $0.50 / 1 млн шығыс токені. Бұл Qwen-ді ақылы түрде шақыру емес — тек коммерциялық баламаға арналған есеп.')
 add_p(doc,'Формула: C_API = N × (T_in × 0.10 + T_out × 0.50) / 1 000 000. GPU: Runpod RTX A5000 × $0.27/сағ × 730 сағ ≈ $197.10/ай (сақтау, желі, әкімшілендіру есепке кірмейді).')
 tab(doc,['Сценарий','Айлық сұрау','API USD/ай','GPU USD/ай'],[
 ('Бастапқы',str(cost['scenario'][0]['requests_per_month']),f"${cost['scenario'][0]['api_cost_usd_per_month']:.4f}",f"${cost['gpu_cost_usd_per_month']:.2f}"),
 ('10 есе көп',str(cost['scenario'][1]['requests_per_month']),f"${cost['scenario'][1]['api_cost_usd_per_month']:.4f}",f"${cost['gpu_cost_usd_per_month']:.2f}"),
 ])
 add_p(doc,f"Тек есептік баға бойынша break-even ≈ {cost['breakeven_requests_per_month_ignoring_other_costs']:,} сұрау/ай. Өте аз жүктемеде толық GPU серверін үнемдеу мақсатында жалға алу тиімді емес; алайда деректерді қорғау үшін локал орналастырудың басқа негіздемесі болуы мүмкін.")
 doc.add_heading('7. Негізгі AI тәуекелдер және бақылау',1)
 tab(doc,['Тәуекел','Бақылау механизмі'],[
 ('Қате санат/құрылғы','AI — тек ұсыныс; оператор түзетіп, растайды; UNKNOWN/OTHER рұқсат.'),
 ('Жеке деректердің таралуы','Синтетикалық сынақ; нақты клиенттің аты, телефоны және басқа PII сыртқы API-ге шықпайды.'),
 ('Қазақша/орысша аралас мәтін','Күрделі және аралас тілдегі тесттер, Macro F1 мен санаттарға бөлінген қателер.'),
 ('Prompt injection','JSON validation, клиент мәтінін нұсқаулық ретінде орындамау.'),
 ('Модель істен шығуы/кідірісі','Таймаут, AI-ды өткізіп жіберу және қолмен толтыру мүмкіндігі.'),
 ('Болжамды шығын/тәуелділік','Айлық лимит, токендер мен қате сұрауларды мониторингтеу.'),
 ])
 add_p(doc,'Пайдаланушы AI ұсынған өрістерді арнайы белгі арқылы көреді; адам растауы болмайынша жүйеге автоматты түрде жіберілмейді. Толық қауіп картасы RISK_REGISTER.md файлында.')
 doc.add_heading('8. Шешім (ADR-002)',1)
 add_p(doc,'Қазіргі шешім: AI-ді MasterDesk-тің өндірістік функционалына әзірше қоспау, алдымен Qwen-нің zero-shot және few-shot экспериментін аяқтау. Себебі baseline өлшенгенімен, модельдің нақтылы өнімділігі әлі белгісіз. Критерийлер орындалса, адам бекітетін optional өріс ұсынысын жеке өзгеріс ретінде қарастыруға болады.')
 if q0 and q1:
  best=max((q0,q1),key=lambda v:v['macro_f1'])
  add_p(doc,f'Қосымша нәтиже: ең жоғары Macro F1 көрсеткен Qwen нұсқасы — {best["prompt_style"]} ({best["macro_f1"]:.4f}). Өнімге енгізу шешімі үшін барлық тәуекел мен класстық F1 тексеріліп, ADR жаңартылуы қажет.')
 doc.add_page_break()
 doc.add_heading('9. Артефакттер және дәлелдер',1)
 tab(doc,['Файл','Міндеті'],[
 ('evals/dataset.jsonl','40 тест мысалы + эталон.'),
 ('evals/results/baseline_*','Нақты baseline CSV және JSON метрикалары.'),
 ('evals/results/qwen_*','Qwen іске қосылғаннан кейін ғана қалыптасатын файлдар.'),
 ('docs/ai/RESULTS_COMPARISON.md','Барлық тәсілді салыстыру, санаттар, нақты қателер.'),
 ('docs/ai/COST_ANALYSIS.md','Тарифтер, токен болжамы және 10× жүктеме.'),
 ('docs/ai/RISK_REGISTER.md','AI тәуекел картасы.'),
 ('docs/adr/ADR-002-AI-ORDER-PREFILL.md','Альтернативалар және өндірістік шешім.'),
 ])
 doc.add_heading('10. Дереккөздер және шектеулер',1)
 add_p(doc,'OpenAI, GPT-6 Luna model pricing (17.11.2026): https://developers.openai.com/api/docs/models/gpt-6-luna')
 add_p(doc,'Runpod, GPU Cloud Pricing (баға 17.11.2026 күні қаралды): https://www.runpod.io/pricing')
 add_p(doc,'Ollama, Qwen2.5 library және қолдану нұсқаулығы: https://ollama.com/library/qwen2.5')
 add_p(doc,'Qwen нәтижесі жоқ кезде AI-дің «жақсаратынын» дәлелдейтін қорытынды берілмейді. Дерек жиыны синтетикалық және нақты кәсіпорын өнімділігін сипаттамайды. Шығын моделі болжамдарға негізделген; нақты API инвойсы емес.')
 footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
 r=footer.add_run('MasterDesk  •  №12 зертханалық жұмыс  •  17.11.2026');r.font.size=Pt(8);r.font.color.rgb=RGBColor(125,132,140)
 OUT.parent.mkdir(parents=True,exist_ok=True)
 doc.save(OUT)
 print('Written:',OUT)

if __name__=='__main__':make()
