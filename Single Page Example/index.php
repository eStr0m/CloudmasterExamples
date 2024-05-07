<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhP Playground v.Calculator</title>
</head>
<body>

  <main>
     <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">

        <input type="number" name="num01" id="num01" placeholder="Number">
        <select name="operator" id="operator">
          <option value="add">+</option>
          <option value="subtract">-</option>
          <option value="multiply">*</option>
          <option value="divide">/</option>
        </select>
        <input type="number" name="num02" id="num02" placeholder="Number">

        <button type="submit">calculate</button>
     </form> 
  </main>

  <?php
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
      // Grabs data from inputs
      $num01 = filter_input(INPUT_POST, "num01", FILTER_SANITIZE_NUMBER_FLOAT);
      $num02 = filter_input(INPUT_POST, "num02", FILTER_SANITIZE_NUMBER_FLOAT);
      $operator = htmlspecialchars($_POST["operator"]);
      
      // Error handlers
      $errors = false;

      if (empty($num01) || empty($num02)) {
        echo "<p class='calc-error'>Please fill in both field</p>";
        $errors = true;
      };

      if (!is_numeric($num01) || !is_numeric($num02)) {
        echo "<p class='calc-error'>Please only use numbers</p>";
        $errors = true;
      };

      //Calculate the numbers if no errors

      if(!$errors) {
        $value = 0;
        switch($operator) {
          case "add":
            $value = $num01 + $num02;
            break;
          case "subtract":
            $value = $num01 - $num02;
            break;
          case "multiply":
            $value = $num01 * $num02;
            break;
          case "divide":
            $value = $num01 / $num02;
            break;
          default:
            echo "<p class='calc-error'>Earth is crashing and stuff went wrong</p>";
        };

        echo"<p class='calc-result'>Result = $value </p>";

      };

    };
  ?>

</body>
</html>