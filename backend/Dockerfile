# Stage 1: Use an official Python image
FROM python:3.11-slim

# Stage 2: Set the working directory inside the container
WORKDIR /app

# Stage 3: Copy only the requirements file first to leverage Docker cache
COPY requirements.txt .

# Stage 4: Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 5: Copy your entire backend application code
COPY ./app ./app

# Stage 6: Expose the port the app runs on
EXPOSE 8000

# Stage 7: The command to run your app
# We use 0.0.0.0 to make it accessible outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]