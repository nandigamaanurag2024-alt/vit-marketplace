module test;

  int arr[4] = '{10, 5, 20, 15};

  initial begin

    $display("Sum = %0d", arr.sum());
    $display("Min = %0d", arr.min());
    $display("Max = %0d", arr.max());

  end

endmodule