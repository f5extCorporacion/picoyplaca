<?php
// Configuración
$json_file = 'datapicoyplaca.json';
$dias_semana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

// Cargar datos existentes
$data = [];
if (file_exists($json_file)) {
    $json_content = file_get_contents($json_file);
    $data = json_decode($json_content, true);
} else {
    // Datos por defecto si el archivo no existe
    $data = [
        "DiasSemanaPicoyplaca" => [
            ["lunes" => [5, 6]],
            ["martes" => [7, 8]],
            ["miercoles" => [9, 0]],
            ["jueves" => [1, 2]],
            ["viernes" => [3, 4]]
        ],
        "Valores" => [
            "dia" => 25000,
            "mes" => 462747
        ]
    ];
}

// Procesar formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['guardar_dias'])) {
        // Actualizar días
        foreach ($dias_semana as $dia) {
            $digitos = isset($_POST[$dia]) ? $_POST[$dia] : [];
            // Convertir a números y eliminar duplicados
            $digitos = array_unique(array_map('intval', $digitos));
            
            // Actualizar el array de datos
            foreach ($data['DiasSemanaPicoyplaca'] as &$item) {
                if (isset($item[$dia])) {
                    $item[$dia] = $digitos;
                    break;
                }
            }
        }
    } elseif (isset($_POST['guardar_valores'])) {
        // Actualizar valores
        $data['Valores']['dia'] = intval($_POST['valor_dia']);
        $data['Valores']['mes'] = intval($_POST['valor_mes']);
    }
    
    // Guardar en archivo
    file_put_contents($json_file, json_encode($data, JSON_PRETTY_PRINT));
    $mensaje = "Datos actualizados correctamente!";
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administrador Pico y Placa</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1, h2 {
            color: #333;
        }
        .form-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .dia-group {
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border: 1px solid #eee;
            border-radius: 4px;
        }
        .digito-option {
            display: inline-block;
            margin-right: 10px;
            margin-bottom: 5px;
        }
        .valor-input {
            width: 150px;
            padding: 8px;
            margin: 5px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #45a049;
        }
        .mensaje {
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .success {
            background-color: #dff0d8;
            color: #3c763d;
            border: 1px solid #d6e9c6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Administrador de Pico y Placa</h1>
        
        <?php if (isset($mensaje)): ?>
            <div class="mensaje success"><?php echo htmlspecialchars($mensaje); ?></div>
        <?php endif; ?>
        
        <div class="form-section">
            <h2>Configuración de días y dígitos</h2>
            <form method="post">
                <?php foreach ($data['DiasSemanaPicoyplaca'] as $dia_data): ?>
                    <?php 
                    $dia = key($dia_data);
                    $digitos = current($dia_data);
                    ?>
                    <div class="dia-group">
                        <h3><?php echo ucfirst($dia); ?></h3>
                        <?php for ($i = 0; $i <= 9; $i++): ?>
                            <div class="digito-option">
                                <input type="checkbox" 
                                       id="<?php echo $dia.'_'.$i; ?>" 
                                       name="<?php echo $dia; ?>[]" 
                                       value="<?php echo $i; ?>"
                                       <?php echo in_array($i, $digitos) ? 'checked' : ''; ?>>
                                <label for="<?php echo $dia.'_'.$i; ?>"><?php echo $i; ?></label>
                            </div>
                        <?php endfor; ?>
                    </div>
                <?php endforeach; ?>
                
                <button type="submit" name="guardar_dias">Guardar Configuración de Días</button>
            </form>
        </div>
        
        <div class="form-section">
            <h2>Valores</h2>
            <form method="post">
                <div>
                    <label for="valor_dia">Valor por día:</label><br>
                    <input type="number" class="valor-input" id="valor_dia" name="valor_dia" 
                           value="<?php echo $data['Valores']['dia']; ?>" min="0">
                </div>
                <div>
                    <label for="valor_mes">Valor por mes:</label><br>
                    <input type="number" class="valor-input" id="valor_mes" name="valor_mes" 
                           value="<?php echo $data['Valores']['mes']; ?>" min="0">
                </div>
                
                <button type="submit" name="guardar_valores">Guardar Valores</button>
            </form>
        </div>
        
        <div class="form-section">
            <h2>Datos actuales (JSON)</h2>
            <pre><?php echo json_encode($data, JSON_PRETTY_PRINT); ?></pre>
        </div>
    </div>
</body>
</html>