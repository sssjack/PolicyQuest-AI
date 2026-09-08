ARG PYTHON_IMAGE=python:3.11-slim
FROM ${PYTHON_IMAGE}
USER root
WORKDIR /ocr
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 libglib2.0-0 libgl1 && rm -rf /var/lib/apt/lists/*
RUN python -m venv /ocr/venv
COPY requirements.txt /ocr/requirements.txt
ARG PIP_INDEX_URL=https://pypi.org/simple
RUN /ocr/venv/bin/pip install --no-cache-dir --timeout 45 -i ${PIP_INDEX_URL} -r requirements.txt
COPY app.py /ocr/app.py
ENV PADDLE_PDX_MODEL_SOURCE=BOS OMP_NUM_THREADS=1 MALLOC_ARENA_MAX=2
ENTRYPOINT ["/ocr/venv/bin/uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8091", "--workers", "1"]
