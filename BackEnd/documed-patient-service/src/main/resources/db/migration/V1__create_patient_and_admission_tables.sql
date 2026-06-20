CREATE TABLE patients (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    fiscal_code VARCHAR(16) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_patients_fiscal_code UNIQUE (fiscal_code),
    CONSTRAINT ck_patients_fiscal_code_format CHECK (fiscal_code ~ '^[A-Z0-9]{16}$')
);

CREATE TABLE admissions (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    admission_date DATE NOT NULL,
    discharge_date DATE,
    department VARCHAR(120) NOT NULL,
    notes VARCHAR(2000),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admissions_patient
        FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT ck_admissions_status
        CHECK (status IN ('ACTIVE', 'DISCHARGED')),
    CONSTRAINT ck_admissions_discharge_date
        CHECK (discharge_date IS NULL OR discharge_date >= admission_date),
    CONSTRAINT ck_admissions_status_date
        CHECK (
            (status = 'ACTIVE' AND discharge_date IS NULL)
            OR (status = 'DISCHARGED' AND discharge_date IS NOT NULL)
        )
);

CREATE INDEX idx_patients_name ON patients (last_name, first_name);
CREATE INDEX idx_admissions_patient ON admissions (patient_id);
CREATE INDEX idx_admissions_admission_date ON admissions (admission_date);
CREATE INDEX idx_admissions_discharge_date ON admissions (discharge_date);
CREATE INDEX idx_admissions_status ON admissions (status);

-- A partial index keeps the single-active-admission rule safe under concurrency.
CREATE UNIQUE INDEX uk_admissions_one_active_per_patient
    ON admissions (patient_id)
    WHERE status = 'ACTIVE';
