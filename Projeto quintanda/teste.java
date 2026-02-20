import java.util.Scanner;
public class teste {
    public static void main(String[] args) {
        System.out.println("informe uma palavra simples: ");
        Scanner sc = new Scanner(System.in);
        String num = sc.nextLine();
        System.out.println("O valor é:  "  + num);
        
        sc.close();
}
}