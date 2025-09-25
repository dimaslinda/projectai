<?php
// Display PHP configuration for debugging upload limits
echo "<h2>PHP Upload Configuration</h2>";
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Setting</th><th>Value</th></tr>";
echo "<tr><td>upload_max_filesize</td><td>" . ini_get('upload_max_filesize') . "</td></tr>";
echo "<tr><td>post_max_size</td><td>" . ini_get('post_max_size') . "</td></tr>";
echo "<tr><td>max_file_uploads</td><td>" . ini_get('max_file_uploads') . "</td></tr>";
echo "<tr><td>memory_limit</td><td>" . ini_get('memory_limit') . "</td></tr>";
echo "<tr><td>max_execution_time</td><td>" . ini_get('max_execution_time') . "</td></tr>";
echo "<tr><td>max_input_time</td><td>" . ini_get('max_input_time') . "</td></tr>";
echo "<tr><td>max_input_vars</td><td>" . ini_get('max_input_vars') . "</td></tr>";
echo "</table>";

echo "<h2>Configuration Files Loaded</h2>";
echo "<p>Loaded php.ini: " . php_ini_loaded_file() . "</p>";
echo "<p>Additional ini files: " . php_ini_scanned_files() . "</p>";

echo "<h2>Full PHP Info</h2>";
phpinfo();
?>