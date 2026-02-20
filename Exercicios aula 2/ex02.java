import java.util.Scanner;

public class ex02 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Digite o peso em kg: ");
        double peso = sc.nextDouble();
        System.out.print("Digite a altura em metros: ");
        double altura = sc.nextDouble();

        double imc = calcularIMC(peso, altura);
        System.out.printf("Seu IMC é: %.2f\n", imc);

        String categoria = classificarIMC(imc);
        System.out.println(categoria);

        sc.close();
    }

    public static double calcularIMC(double peso, double altura) {
        return peso / (altura * altura);
    }

    public static String classificarIMC(double imc) {
        if (imc < 18.5) {
            return "Abaixo do peso";
        } else if (imc < 25) {
            return "Peso normal";
        } else if (imc < 30) {
            return "Sobrepeso";
        } else {
            return "Obesidade";
        }
    }
}
