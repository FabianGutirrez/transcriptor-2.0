import os
import google.generativeai as genai
from firebase_admin import credentials, firestore, initialize_app

# Configuración de Gemini
# Nota: La API Key debe estar en las variables de entorno
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Inicialización de Firebase (Asumiendo credenciales por defecto en Cloud Run)
try:
    initialize_app()
except ValueError:
    pass # Ya inicializada

db = firestore.client()

def process_clinical_media(file_path: str, patient_id: str, therapist_id: str):
    """
    Procesa un archivo de audio o video para generar un informe fonoaudiológico estructurado.
    """
    # Selección de modelo 1.5 Pro para alta complejidad multimodal
    model = genai.GenerativeModel("gemini-1.5-pro")
    
    # Cargar el archivo a la File API de Gemini (recomendado para archivos grandes)
    print(f"Subiendo archivo {file_path} a Gemini File API...")
    sample_file = genai.upload_file(path=file_path)
    
    # Prompt de Sistema Especializado
    system_instruction = """
    Actúa como un Especialista en Fonoaudiología Clínico con enfoque en Análisis de Datos. 
    Tu tarea es escuchar/ver la sesión y producir un informe técnico.
    
    Debes estructurar el resultado en:
    1. TRANSCRIPCIÓN: El texto literal de lo hablado.
    2. ANÁLISIS DE FLUIDEZ: Evaluación de ritmo, pausas y velocidad del habla.
    3. ARTICULACIÓN: Detalle de errores fonéticos, sustituciones u omisiones.
    4. COHERENCIA TEMÁTICA: Capacidad del paciente para mantenerse en el tema.
    5. SUGERENCIAS: Plan de acción para las siguientes 4 semanas.
    """
    
    # Generación de contenido
    response = model.generate_content(
        [sample_file, system_instruction],
        generation_config={"temperature": 0.2}
    )
    
    # Guardar en Firestore
    report_ref = db.collection('reports').add({
        'patientId': patient_id,
        'therapistId': therapist_id,
        'analysis': response.text,
        'status': 'completado',
        'createdAt': firestore.SERVER_TIMESTAMP,
        'multimodalSource': sample_file.uri
    })
    
    # Limpiar archivo temporal en la API (opcional)
    # genai.delete_file(sample_file.name)
    
    return {
        "report_id": report_ref[1].id,
        "text": response.text
    }

if __name__ == "__main__":
    # Ejemplo de uso local
    # result = process_clinical_media("sesion_paciente_01.mp4", "patient123", "therapist456")
    # print(result)
    pass
